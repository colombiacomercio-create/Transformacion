const fs = require('fs');
let c = fs.readFileSync('src/components/KanbanBoard.tsx', 'utf8');

c = c.replace(
    '        {actividadSeleccionada && (\n          <ModalDetalleActividad \n            actividad={actividadSeleccionada}\n            onClose={() => setActividadSeleccionada(null)}\n            onRefresh={fetchActividades}\n            userData={userData}\n          />\n        )}\n      </div>\n    );\n  }',
    '        {actividadSeleccionada && (\n          <ModalDetalleActividad \n            actividad={actividadSeleccionada}\n            onClose={() => setActividadSeleccionada(null)}\n            onRefresh={fetchActividades}\n            userData={userData}\n          />\n        )}\n      </div>\n      </div>\n    );\n  }'
);
// Also fallback for CRLF
c = c.replace(
    '        {actividadSeleccionada && (\r\n          <ModalDetalleActividad \r\n            actividad={actividadSeleccionada}\r\n            onClose={() => setActividadSeleccionada(null)}\r\n            onRefresh={fetchActividades}\r\n            userData={userData}\r\n          />\r\n        )}\r\n      </div>\r\n    );\r\n  }',
    '        {actividadSeleccionada && (\r\n          <ModalDetalleActividad \r\n            actividad={actividadSeleccionada}\r\n            onClose={() => setActividadSeleccionada(null)}\r\n            onRefresh={fetchActividades}\r\n            userData={userData}\r\n          />\r\n        )}\r\n      </div>\r\n      </div>\r\n    );\r\n  }'
);

fs.writeFileSync('src/components/KanbanBoard.tsx', c);
