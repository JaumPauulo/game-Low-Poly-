import { MonitorX } from 'lucide-react';

export function WebGLFallback() {
  return (
    <div
      id="webgl-fallback-screen"
      className="w-full h-screen flex items-center justify-center bg-slate-100 p-6"
    >
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600 mb-4">
          <MonitorX className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-2">
          Aceleração Gráfica Indisponível
        </h2>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          O seu navegador ou dispositivo atual não possui suporte ativo a WebGL/Hardware Acceleration,
          que é indispensável para renderizar o diorama 3D do Agent Office.
        </p>
        <div className="text-left text-xs bg-slate-50 border border-slate-200 p-4 rounded-lg text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-700">Sugestões para ativar:</p>
          <p>• Verifique se a aceleração de hardware está ativada nas configurações do navegador.</p>
          <p>• Atualize os drivers de vídeo do seu dispositivo.</p>
          <p>• Abra a aplicação em uma aba normal caso esteja utilizando modo privado restrito.</p>
        </div>
      </div>
    </div>
  );
}
