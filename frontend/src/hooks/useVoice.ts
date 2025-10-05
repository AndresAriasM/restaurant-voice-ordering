import { useState, useRef } from 'react';
import { useCartStore } from '@/store/cart';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function useVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const { sessionId, setSessionId, setItems, setFocusedProduct } = useCartStore();

  const connect = async () => {
    try {
      console.log('🔌 Iniciando conexión...');
      
      // Obtener ephemeral key
      const { data } = await axios.post(`${API_URL}/openai/ephemeral-key`, {
        session_id: sessionId || undefined,
      });
      
      console.log('🔑 Ephemeral key obtenida, session:', data.session_id);
      setSessionId(data.session_id);

      // Crear RTCPeerConnection
      const pc = new RTCPeerConnection();

      // Agregar audio local
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      pc.addTrack(ms.getTracks()[0]);
      console.log('🎤 Micrófono conectado');

      // Reproducir audio remoto
      pc.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.play();
        setIsListening(true);
        console.log('🔊 Audio remoto conectado');
      };

      // Data channel para eventos
      const dc = pc.createDataChannel('oai-events');
      
      dc.onopen = () => {
        console.log('✅ Data channel abierto');
        // Configurar sesión con turn-taking
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: `Eres el asistente de Burger House. Session ID: ${data.session_id}. IMPORTANTE: Siempre incluye session_id en las llamadas a funciones y SIEMPRE responde verbalmente.`,
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            input_audio_transcription: {
              model: 'whisper-1'
            }
          }
        }));
      };

      dc.onmessage = async (e) => {
        const event = JSON.parse(e.data);
        console.log('📥 Event:', event.type, event);
        
        // Transcripción de respuesta del asistente
        if (event.type === 'response.audio_transcript.done') {
          setTranscript(prev => [...prev, `Asistente: ${event.transcript}`]);
        }
        
        // Transcripción del usuario
        if (event.type === 'conversation.item.input_audio_transcription.completed') {
          setTranscript(prev => [...prev, `Tú: ${event.transcript}`]);
        }

        // Llamada a función
        if (event.type === 'response.function_call_arguments.done') {
          const args = JSON.parse(event.arguments);
          console.log('🔧 Function call:', event.name, args);
          
          // Enfocar producto si se menciona
          if (args.product_id) {
            console.log('🎯 Enfocando producto:', args.product_id);
            setFocusedProduct(args.product_id);
          }
          
          // Ejecutar función en backend
          try {
            const result = await axios.post(`${API_URL}/openai/function-call`, {
              name: event.name,
              arguments: { ...args, session_id: data.session_id }
            });
            
            console.log('✅ Function result:', result.data);
            
            // Actualizar carrito si hay items
            if (result.data.items) {
              console.log('🛒 Actualizando carrito:', result.data.items);
              setItems(result.data.items);
            }

            // Enviar resultado de vuelta a OpenAI
            dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: event.call_id,
                output: JSON.stringify(result.data)
              }
            }));
            
            // IMPORTANTE: Forzar que genere una respuesta
            dc.send(JSON.stringify({
              type: 'response.create'
            }));
            
            console.log('🎤 Forzando respuesta del asistente...');
          } catch (error) {
            console.error('❌ Error ejecutando función:', error);
          }
        }
      };

      // Crear oferta WebRTC
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('📤 Enviando oferta SDP...');

      // Enviar oferta a OpenAI
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${data.ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('✅ Conexión WebRTC establecida');
      pcRef.current = pc;
      dcRef.current = dc;
      setIsConnected(true);

    } catch (error) {
      console.error('❌ Error conectando:', error);
      alert('Error al conectar. Revisa la consola (F12)');
    }
  };

  const disconnect = () => {
    if (pcRef.current) {
      pcRef.current.close();
      setIsConnected(false);
      setIsListening(false);
      console.log('🔌 Desconectado');
    }
  };

  return { isConnected, isListening, transcript, connect, disconnect };
}