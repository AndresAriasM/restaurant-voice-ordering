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
  const { sessionId, setSessionId, setItems, setFocusedProduct, setCustomer, setShowCheckout } = useCartStore();

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
          
          // Asegurarse de que SIEMPRE tenga session_id
          const finalArgs = { ...args, session_id: data.session_id };
          
          // Enfocar producto si se menciona
          if (finalArgs.product_id) {
            console.log('🎯 Enfocando producto:', finalArgs.product_id);
            setFocusedProduct(finalArgs.product_id);
          }
          
          // Ejecutar función en backend
          try {
            const result = await axios.post(`${API_URL}/openai/function-call`, {
              name: event.name,
              arguments: finalArgs
            });
            
            console.log('✅ Function result:', result.data);
            
            // Actualizar carrito si hay items
            if (result.data.items) {
              console.log('🛒 Actualizando carrito:', result.data.items);
              setItems(result.data.items);
            }

            // Actualizar datos del cliente si se guardaron
            if (result.data.customer) {
              console.log('👤 Actualizando datos del cliente:', result.data.customer);
              setCustomer(result.data.customer);
            }

            // Abrir checkout si la función indica que está listo
            if (event.name === 'ready_for_checkout') {
              if (result.data.ready && result.data.success && result.data.open_checkout) {
                console.log('💳 Abriendo checkout...');
                setShowCheckout(true);
              } else {
                console.warn('⚠️ No se puede abrir checkout:', result.data.message || result.data.error);
                // El asistente debería manejar esto verbalmente
              }
            }

            // Si cualquier función retorna open_checkout=true, abrir el modal
            if (result.data.open_checkout === true) {
              console.log('💳 Flag open_checkout detectado, abriendo modal...');
              setShowCheckout(true);
            }

            // Log para debugging
            if (event.name === 'ready_for_checkout' || event.name === 'reopen_checkout') {
              console.log('🔍 Checkout function called:', {
                function: event.name,
                success: result.data.success,
                ready: result.data.ready,
                open_checkout: result.data.open_checkout,
                should_open: result.data.open_checkout === true
              });
            }

            // Mostrar errores en consola para debugging
            if (result.data.error) {
              console.error('❌ Error en función:', result.data.error);
            }

            // Enviar resultado de vuelta a OpenAI
            if (dc.readyState === 'open') {
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
            } else {
              console.warn('⚠️ Data channel no está abierto, estado:', dc.readyState);
            }
          } catch (error) {
            console.error('❌ Error ejecutando función:', error);
            
            // Enviar error a OpenAI si el canal está abierto
            if (dc.readyState === 'open') {
              dc.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: event.call_id,
                  output: JSON.stringify({ error: 'Error ejecutando función' })
                }
              }));
              
              dc.send(JSON.stringify({
                type: 'response.create'
              }));
            }
          }
        }
      };

      dc.onerror = (error) => {
        console.error('❌ Data channel error:', error);
      };

      dc.onclose = () => {
        console.log('🔌 Data channel cerrado');
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
    if (dcRef.current) {
      dcRef.current.close();
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    setIsConnected(false);
    setIsListening(false);
    console.log('🔌 Desconectado');
  };

  return { isConnected, isListening, transcript, connect, disconnect };
}