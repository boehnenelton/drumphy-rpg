import React from 'react';

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#0a0a0a] p-6 md:p-10 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-6 text-2xl text-gray-500 hover:text-white transition-colors">&times;</button>
        <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">Crediting Information</h2>
        <div className="space-y-4 text-gray-400 text-sm">
          <p><span className="text-gray-500 uppercase tracking-widest text-xs block mb-1">Name</span> <span className="text-white text-base">Elton Boehnen</span></p>
          <p><span className="text-gray-500 uppercase tracking-widest text-xs block mb-1">Email</span> <span className="text-white text-base">boehnenelton2024@gmail.com</span></p>
          <p><span className="text-gray-500 uppercase tracking-widest text-xs block mb-1">Github</span> <a href="https://github.com/boehnenelton" target="_blank" rel="noreferrer" className="text-[#DE2626] hover:text-white transition-colors text-base">github.com/boehnenelton</a></p>
          <p><span className="text-gray-500 uppercase tracking-widest text-xs block mb-1">Site</span> <a href="https://boehnenelton2024.pages.dev" target="_blank" rel="noreferrer" className="text-[#DE2626] hover:text-white transition-colors text-base">boehnenelton2024.pages.dev</a></p>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 text-xs text-gray-600 uppercase tracking-widest">
          <p>Development Standards Policy</p>
          <p>Version 1: (10-27-25)</p>
        </div>
      </div>
    </div>
  );
}
