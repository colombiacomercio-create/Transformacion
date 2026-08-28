const fs = require('fs');
const file = 'frontend/src/components/gestion/FichasDecoradas.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the container for EJECUCIÓN PRESUPUESTAL
content = content.replace(
  '<div className="flex justify-around items-end h-32">',
  '<div className="flex justify-around items-end h-32 mt-4">'
);
content = content.replace(
  '<span className="font-bold text-[10px] block mb-1 text-gray-500">COMPROMISOS</span>',
  '<span className="font-bold text-xs block mb-3 text-gray-700">COMPROMISOS</span>'
);
content = content.replace(
  '<span className="font-bold text-[10px] block mb-1 text-gray-500">GIROS</span>',
  '<span className="font-bold text-xs block mb-3 text-gray-700">GIROS</span>'
);

// Fix the title overlap by increasing padding in renderCard
content = content.replace(
  'pt-12 pb-4 px-4 h-full',
  'pt-14 pb-4 px-4 h-full'
);
content = content.replace(
  'py-1.5 text-center text-white font-bold text-xs rounded-t-lg',
  'py-2 text-center text-white font-bold text-sm rounded-t-[10px]'
);

// Fix the "No reportado" for Meta Obras to be bolder
content = content.replace(
  '<span className="block text-red-500 text-[8px] leading-none mt-1 font-normal">No reportado</span>',
  '<span className="block text-red-500 text-[10px] leading-none mt-1 font-bold">No reportado</span>'
);

fs.writeFileSync(file, content);
console.log('Fixed UI issues in FichasDecoradas');
