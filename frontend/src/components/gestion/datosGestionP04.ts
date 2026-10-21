export interface AccionFocalizadaOct {
  tipo: string;
  fechas: string;
  actividad: string;
  observacion: string;
}

export interface PuntoFocalizadoOct {
  id: string;
  uaespId: string;
  ld: string;
  d: string;
  estadoSeleccion: string;
  problematica: string;
  responsable: string;
  contacto: string;
  puntosFicha: string;
  lat: number;
  lng: number;
  acciones: AccionFocalizadaOct[];
}

export interface GestionP04Datos {
  corte: string;
  universo: {
    basePgirs: number;
    activosCenso: number;
    nuevos: number;
    confirmados: number;
    enConfirmacion: number;
    accionesFocalizadasOct: number;
    maximoPosible: number;
    trayectoria: { label: string; val: number; h: number; bg: string; fg: string; border?: string }[];
  };
  resultado: {
    ivcOperativos: number;
    ivcMeta: number;
    ivcPct: number;
    ivcComparendos: number;
    ivcPuntosCriticos: number;
    ivcCambuches: number;
    sensParticipantes: number;
    sensMeta: number;
    sensPct: number;
    sensRegistros: number;
    sensPromedio: number;
    sensLocalidades: number;
  };
  gestion: {
    puntosDistintos50m: number;
    intervencionesReportadas: number;
    intervencionesAgrupables: number;
    intervencionesNivelBarrio: number;
    diametroMaxM: number;
    puntosUnaVisita: number;
    puntosUnaVisitaPct: number;
    puntosAltaRecurrencia: number;
    residuosRecolectados: number;
    cambuchesRetirados: number;
    intervencionesConCambuches: number;
    areaRecuperadaM2: number;
    serieMensual: { m: string; i: number; p: number }[];
    tiposIntervencion: { t: string; n: number; w: number; c: string; sub: string }[];
  };
  rankingLocalidad: {
    loc: string;
    i: number;
    ag: number;
    p: number;
    t: number;
    camb: number;
    m2: number;
  }[];
}

export const PUNTOS_FOCALIZADOS_OCT_2026: PuntoFocalizadoOct[] = [
  {
    "id": "UAESP-1110696-3",
    "uaespId": "1110696",
    "ld": "Suba",
    "d": "CARRERA 141 ENTRE CALLE 142 Y CALLE 142 C",
    "estadoSeleccion": "Marcado con X",
    "problematica": "Punto de arrojo frecuente de residuos especiales (voluminosos, residuos de construcción y demolición, neumáticos fuera de uso). En días de recolección los residentes del sector usan este punto para dejar los residuos ordinarios para que sean recogidos por el vehículo. Usualmente dejan residuos ordinarios fuera del horario y días de recolección.",
    "responsable": "Jose Luis Cerquera / Oficina Gestión Ambiental",
    "contacto": "3125300899 / jose,cerquera@gobiernobogota.gov.co",
    "puntosFicha": "1110662 – CARRERA 160 CON CALLE 136F; 1110695 – TRANSVERSAL 127 CALLE 132 B BIS A; 1110668 – CARRERA 58 ENTRE 170 Y 175; 1110696 – CARRERA 141 ENTRE CALLE 142 Y CALLE 142 C; 1110670 – CARRERA 118 ENTRE CALLE 139 Y CALLE 132; 1110698 – CARRERA 119D CON CALLE 129; 1110676 – CALLE 169 CON CARRERA 45A; 1110703 – DIAGONAL 129B CON CARRERA 122C BIS; 1110686 – CALLE 142 CON CARRERA 148B; 1110706 – CARRERA 141B CON DIAGONAL 149; 1110688 – CALLE 142C CARRERA 148 B BIS; 1110709 – CALLE 129C CON CARRERA 88 A; 1110689 – CALLE 130A Y CALLE 135 CON CARRERA 135; 1110711 – TRANSVERSAL 127 CON DIAGONAL 140 AL OCCIDENTE DEL CAÑO; 1110693 – CARRERA 136A CON CALLE 142",
    "lat": 4.7482,
    "lng": -74.1162,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "Primera semana octubre",
        "actividad": "Operador de residuos especiales (Aguas de Bogotá) realizará la recolección en la zona.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "23/10",
        "actividad": "Operativo de imposición de medidas correctivas (caza infractores), enmarcadas dentro de la estrategia \"Cochino que ensucia, paga\".",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "20/10",
        "actividad": "Jornada de sensibilización sobre manejo adecuado de residuos sólidos.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1110693-4",
    "uaespId": "1110693",
    "ld": "Suba",
    "d": "CARRERA 136A CON CALLE 142",
    "estadoSeleccion": "Marcado con X",
    "problematica": "Punto de arrojo de residuos especiales (voluminosos, residuos de construcción y demolición) y, en días de recolección los residentes del sector usan este punto para dejar los residuos ordinarios para que sean recogidos por el vehiculo. Usualmente dejan residuos ordinarios fuera del horario y días de recolección.",
    "responsable": "Jose Luis Cerquera / Oficina Gestión Ambiental",
    "contacto": "3125300899 / jose,cerquera@gobiernobogota.gov.co",
    "puntosFicha": "1110662 – CARRERA 160 CON CALLE 136F; 1110695 – TRANSVERSAL 127 CALLE 132 B BIS A; 1110668 – CARRERA 58 ENTRE 170 Y 175; 1110696 – CARRERA 141 ENTRE CALLE 142 Y CALLE 142 C; 1110670 – CARRERA 118 ENTRE CALLE 139 Y CALLE 132; 1110698 – CARRERA 119D CON CALLE 129; 1110676 – CALLE 169 CON CARRERA 45A; 1110703 – DIAGONAL 129B CON CARRERA 122C BIS; 1110686 – CALLE 142 CON CARRERA 148B; 1110706 – CARRERA 141B CON DIAGONAL 149; 1110688 – CALLE 142C CARRERA 148 B BIS; 1110709 – CALLE 129C CON CARRERA 88 A; 1110689 – CALLE 130A Y CALLE 135 CON CARRERA 135; 1110711 – TRANSVERSAL 127 CON DIAGONAL 140 AL OCCIDENTE DEL CAÑO; 1110693 – CARRERA 136A CON CALLE 142",
    "lat": 4.7475,
    "lng": -74.1134,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "Primera semana octubre",
        "actividad": "Operador de residuos especiales (Aguas de Bogotá) realizará la recolección en la zona.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "23/10",
        "actividad": "Operativo de imposición de medidas correctivas (caza infractores), enmarcadas dentro de la estrategia \"Cochino que ensucia, paga\".",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "20/10",
        "actividad": "Jornada de sensibilización sobre manejo adecuado de residuos sólidos.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1040030-5",
    "uaespId": "1040030",
    "ld": "San Cristóbal",
    "d": "CARRERA 4 ESTE CALLE 36 H SUR",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En este punto se evidencia un arrojo frecuente de residuos por parte de los habitantes del sector , siendo reincidente posterior a la recolección por la empresa de servicios.",
    "responsable": "Joan Felipe Paez Sanchez",
    "contacto": "Jpaezsfdls@gmail.com",
    "puntosFicha": "1040027 – CARRERA 8 # 13 SUR; 1040056 – CARRERA 10 CALLE 1C SUR; 1040028 – CARRERA 6 CALLE 1; 1040060 – CARRERA 8 C ESTE CON CALLE 36 L SUR; 1040030 – CARRERA 4 ESTE CALLE 36 H SUR; 1040088 – DIAGONAL 36 G SUR CON CARRERA 2B; 1040040 – CARRERA 6 CALLE 1 A SUR; 1040091 – CALLE 40A SUR CON CARRERA 1B; 1040054 – CALLE 41 SUR CARRERA 13B ESTE; 1040089 – CALLE 37 B SUR CARRERA 1A SI; 1040055 – CALLE 41 SUR CARRERA 16 ESTE",
    "lat": 4.5542,
    "lng": -74.0815,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "28/10",
        "actividad": "Retiro de residuos acumulados, limpieza del área, encerramiento y embellecimiento con especies de jardinería.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "28/10",
        "actividad": "hacer recorridos de control, verificar infracciones y aplicar las medidas correspondientes.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "27/10, 29/10",
        "actividad": "Sensibilización para  orientar a residentes y comercios sobre horarios, separación y disposición adecuada.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1040060-6",
    "uaespId": "1040060",
    "ld": "San Cristóbal",
    "d": "CARRERA 8 C ESTE CON CALLE 36 L SUR",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En este punto se evidencia un arrojo frecuente de residuos por parte de los habitantes del sector , siendo reincidente posterior a la recolección por la empresa de servicios.",
    "responsable": "Felipe Paez Sanchez",
    "contacto": "Jpaezsfdlsc@gmail.com",
    "puntosFicha": "1040027 – CARRERA 8 # 13 SUR; 1040056 – CARRERA 10 CALLE 1C SUR; 1040028 – CARRERA 6 CALLE 1; 1040060 – CARRERA 8 C ESTE CON CALLE 36 L SUR; 1040030 – CARRERA 4 ESTE CALLE 36 H SUR; 1040088 – DIAGONAL 36 G SUR CON CARRERA 2B; 1040040 – CARRERA 6 CALLE 1 A SUR; 1040091 – CALLE 40A SUR CON CARRERA 1B; 1040054 – CALLE 41 SUR CARRERA 13B ESTE; 1040089 – CALLE 37 B SUR CARRERA 1A; 1040055 – CALLE 41 SUR CARRERA 16 ESTE",
    "lat": 4.552,
    "lng": -74.0871,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "21/10",
        "actividad": "Retiro de residuos acumulados, limpieza del área y embellecimiento del espacio que promueva a el cuidado del espacio.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "21/10",
        "actividad": "Hacer recorridos de control, verificar infracciones y aplicar las medidas correspondientes.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "20/10  22/10",
        "actividad": "Sensibilización para orientar a residentes y comercios sobre horarios, separación y disposición adecuada.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1030025-7",
    "uaespId": "1030025",
    "ld": "Santa Fe",
    "d": "CALLE 33 CARRERA 1",
    "estadoSeleccion": "Marcado con X (cuadro de texto superpuesto)",
    "problematica": "El punto se utiliza de manera constante para acumulación de escombros, residuos voluminosos y residuos ordinarios ya que se encuentra sobre una via principal, lo que facilita la acumulacion de residuos, pero tambien la recolección",
    "responsable": "Carmen Lucia Cordoba",
    "contacto": "3133791513 carmen.cordoba@gobiernobogota.gov.co",
    "puntosFicha": "1030026 – CALLE 6 CARRERA 9; 1030083 – JIMENEZ CON CARRERA 11 LA CAPUCHINA; 1030078 – CARRERA 6 CON CALLE 1D; 1030084 – CALLE 2 B CON CARRERA 6; 1030079 – CARRERA 4 # 2B - 27; 1030085 – CARRERA 12 CON CALLE 23; 1030080 – CALLE 2A # 4 - 31; 1030103 – AVENIDA COMUNEROS ENTRE CARRERA 8 Y 9; 1030082 – AVENIDA CALLE 3 ENTRE CARRERA 3 ESTE Y 2 A ESTE; 1030025 – CALLE 33 CARRERA 1",
    "lat": 4.6195,
    "lng": -74.0638,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "15/10",
        "actividad": "Jornada de limpieza y embellecimiento con pintura y señalización sobre no arrojar basuras",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "19/10,28/10",
        "actividad": "Jornada caza infractores para aplicar las medidas conrrespondientes y recorridos semanales de verificacion junto con sensibilizacion .",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "09/10,13/10,16/10,22/10,27/10",
        "actividad": "Jornadas de sensibilizacion sobre las frecuencias de recoleccion y orientadas a difundir las intervenciones que se van a hacer para vincular a la comunidad",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1070132-8",
    "uaespId": "1070132",
    "ld": "Bosa",
    "d": "CARRERA 105 B ENTRE CALLE 72 SUR Y CALLE 69 A SUR",
    "estadoSeleccion": "Marcado con X",
    "problematica": "Se evidencia disposición recurrente e inadecuada de residuos y escombros, generando un punto crítico de acumulación por la práctica reiterada de la comunidad. Su cercanía a un cuerpo de agua y a un establecimiento educativo aumenta el riesgo de afectación ambiental y sanitaria, por lo que se prioriza su intervención.",
    "responsable": "DIANA CAROLINA MARTINEZ",
    "contacto": "318 8241857  -   diana.martinezq@gobiernobogota.gov.co",
    "puntosFicha": "1070127 – CALLE 56 F SUR CARRERA 107; 1070145 – DIAGONAL 89B SUR TRANSVERSAL 80I; 1070132 – CARRERA 105 B ENTRE CALLE 72 SUR Y CALLE 69 A SUR; 1070167 – CARRERA 87 C ENTRE CALLE 70 SUR Y CALLE 69 B SUR; 1070136 – AVENIDA GUAYACANES-TINTAL CALLE 57 C SUR; 1070169 – CALLE 55 SUR AVENIDA CARRERA 86; 1070141 – CALLE 63 SUR ENTRE CARRERA 93 C Y CARRERA 94 B; 1070174 – CALLE 77 SUR CARRERA 86",
    "lat": 4.6228,
    "lng": -74.2014,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "09-10-2026",
        "actividad": "Recuperación integral del punto mediante retiro de residuos y escombros, limpieza y adecuación del espacio, en articulación con Aguas de Bogotá e IDRD. Se contemplan acciones de siembra y recuperación física del área.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "15/10/2026 , 22/10/2026",
        "actividad": "Realizar jornadas de IVC y estrategia Caza Infractores para identificar comportamientos contrarios a la convivencia asociados a la disposición inadecuada de residuos y realizar seguimiento al punto.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "14 /10/2026,  26/10/2026",
        "actividad": "Continuar los procesos de sensibilización con la comunidad, adelantados desde julio y agosto, orientados a la adecuada disposición de residuos, cuidado del entorno y sostenibilidad del espacio recuperado.",
        "observacion": ""
      },
      {
        "tipo": "Otra acción necesaria:  Mesa de articulacion con la comunidad",
        "fechas": "[30/,07/ 2026 -  27/08/2026   14/10/2026]",
        "actividad": "Dar continuidad a las mesas de trabajo con comunidad y entidades, fortaleciendo acuerdos, responsabilidades y acciones de apropiación comunitaria para garantizar la sostenibilidad del espacio.",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla"
      }
    ]
  },
  {
    "id": "UAESP-1190190-9",
    "uaespId": "1190190",
    "ld": "Ciudad Bolívar",
    "d": "CALLE 61 SUR 23C",
    "estadoSeleccion": "Marcado con X",
    "problematica": "El punto presenta disposición inadecuada de residuos de construcción y demolición (RCD) y voluminosos, generando impacto directo sobre la ronda de protección del Humedal El Tunjo",
    "responsable": "Camila Pulgarin Estrada",
    "contacto": "3057434338  geraldine.pulgarin@gobiernobogota.gov.co",
    "puntosFicha": "1190185 – TRANSVERSAL 22 CALLE 69 J SUR; 1190200 – CALLE 61 SUR TRANSVERSAL 28; 1190189 – CALLE 68 SUR 20 A; 1190201 – CALLE 58C SUR 41; 1190190 – CALLE 61 SUR 23C; 1190202 – CALLE 58C SUR ENTRE CARRERA 45A Y CARRERA 47; 1190196 – CARRERA 15 D ENTRE CALLE 76 Y CALLE 71 SUR; 1190334 – CARRERA 19 59A SUR",
    "lat": 4.5735,
    "lng": -74.1482,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "16 de octubre",
        "actividad": "Retirar",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": ":mes de octubre",
        "actividad": "Se solicitara la programación de pillados en el punto en la mesa local operagtiva",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "14 y 22 de octubre",
        "actividad": "Sensibilizacion puerta a puertga  orientar a residentes y comercios sobre horarios, separación y disposición adecuada.",
        "observacion": ""
      },
      {
        "tipo": "Otra acción necesaria: [indique cuál]",
        "fechas": "19 de octubre",
        "actividad": "Reunión con entidades para intervención integral del punto",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1050052-10",
    "uaespId": "1050052",
    "ld": "Usme",
    "d": "CALLE 136 A SUR ENTRE CARRERA 14 Y CARRERA 14 I",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En este punto existe un arrojo constante de residuos voluminosos. Generados por la misma comunidad y establecimientos comerciales. En el sector se evidencia una amplia zona de verde.",
    "responsable": "Jenny Paola Muñoz Ardila – IVC Ambiental",
    "contacto": "3107992719 jennyp.munoz@gobiernobogota.gov.co",
    "puntosFicha": "1050042 – CARRERA 7 CON CALLE 108 SUR; 1050049 – AVENIDA CARACAS ENTRE CALLE 93B SUR Y CALLE 93 SUR; 1050045 – DIAGONAL 57A CON TRANSVERSAL 3B; 1050051 – CARRERA 14 L CALLE 71 F SUR; 1050046 – CARRERA 14 A CON CALLE 70 BIS SUR; 1050052 – CALLE 136 A SUR ENTRE CARRERA 14 Y CARRERA 14 I",
    "lat": 4.4785,
    "lng": -74.1195,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "28 de octubre",
        "actividad": "retirar residuos acumulados, limpiar el área e instalar señalización.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "Por confirmar en mesa local",
        "actividad": "Recorrido e intervención programada en el punto",
        "observacion": "Sin fecha definida"
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "13, 20",
        "actividad": "orientar a residentes y comercios sobre horarios, separación y disposición adecuada.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1160325-11",
    "uaespId": "1160325",
    "ld": "Puente Aranda",
    "d": "CALLE 17 A ENTRE CARRERA 57 Y CARRERA 58",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En estos puntos se realiza disposición inadecuada de residuos de gran volumen, RCD,  algunas veces se han evidenciado biosanitarios,, asi como domiciliarios, es un punto de arrojo mixto, en el año 2025 y 2026, alcaldía local ha realizo acompañamiento y presencia en el punto como parte de actividad de recuperación y sostenimiento, se realizó recuperación de espacio público con rehabilitación de andenes, y mural  por el día de la Bogotaneidad, es un sector industrial y con presencia de bodegas de reciclaje, chatarrerías, residencia, educativo y de transición de  Esta afectado por la presencia de carreteros y CHC, arrojo de RCD, voluminosos, de los habitantes del sector y comerciantes, queda alrededor de la  cárcel modelo,  existe un lote administrado por la universidad de Cundinamarca el cual realizo un cerramiento pero en este momento por la presencia  y acumulación de llantas está en riesgo de caída",
    "responsable": "Lizeth Pérez - Gestión Juriridca y polivica Referente Ambiental",
    "contacto": "3107547924   lizeth.perez@gobiernobogota.gov.co",
    "puntosFicha": "1160310 – CALLE 13 30; 1160320 – TRANSVERSAL 42 5A; 1160318 – CALLE 6 44; 1160321 – TRANSVERSAL 42 12; 1160319 – CALLE 6 47; 1160325 – CALLE 17 A ENTRE CARRERA 57 Y CARRERA 58",
    "lat": 4.6323,
    "lng": -74.1094,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "Seguimiento semanal:\nFrecuencia prioritaria Lunes y jueves en la noche por el operador  (aguas de Bogotá)  y LIME martes, jueves y sábado en horario diurno.",
        "actividad": "Continuar con el apoyo del operador en la atención y recolección de los residuos domiciliarios y de gran volumen que arrojan en el punto con el fin de mantener el espacio público limpio.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "20/10, 28/10  (pueden variar de acuerdo con disponibilidad de PONAL)",
        "actividad": "Realizar operativos de IVC en establecimientos de comercio que afecten el espacio público entorno al punto crítico con el fin de generar medidas correctivas y recorridos de verificación extensión actividad económica.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "15/10, 22/10, 29/10",
        "actividad": "Realiza jornadas de sensibilización al sector comercial y residencial sobre los horarios de recolección del operador y manejo adecuado de espacio publico",
        "observacion": ""
      },
      {
        "tipo": "Otra acción necesaria:  PAC puesto de atención comunitaria, presencia alcaldía en el sector",
        "fechas": "9/10 ,  14/10 , 21/10, 27/10",
        "actividad": "Realizar presencia en el sector, con el fin de atender en línea las afectaciones del punto por arrojo de residuos y mal uso del espacio público, así como atención a la comunidad alrededor con el fin de atender Quejas.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1160310-12",
    "uaespId": "1160310",
    "ld": "Puente Aranda",
    "d": "CALLE 13 30",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En este punto se evidencia presencia de carreteros y habitabilidad en calle, existe acumulación de basuras por la separación en la fuente que realizan, es un sector comercial y de vías principales.",
    "responsable": "Lizeth Pérez - Gestión Juriridca y polivica Referente Ambiental",
    "contacto": "3107547924   lizeth.perez@gobiernobogota.gov.co",
    "puntosFicha": "1160310 – CALLE 13 30; 1160320 – TRANSVERSAL 42 5A; 1160318 – CALLE 6 44; 1160321 – TRANSVERSAL 42 12; 1160319 – CALLE 6 47; 1160325 – CALLE 17 A ENTRE CARRERA 57 Y CARRERA 58",
    "lat": 4.6148,
    "lng": -74.0906,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "15/10  Pendiente fecha de intervención",
        "actividad": "Realizar jornadas de abordaje y recorrido con entidades con el fin de verificar estado del punto y concretar jornadas de limpieza y embellecimiento..\nContinuar trabajo de apoyo con el operador para limpieza y priorización del punto.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "20/10, 28/10  (pueden variar de acuerdo con disponibilidad de PONAL)",
        "actividad": "Realizar operativos de IVC en establecimientos de comercio que afecten el espacio público entorno al punto crítico con el fin de generar medidas correctivas y recorridos de verificación extensión actividad económica.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "15/10, 22/10, 29/10",
        "actividad": "Realiza jornadas de sensibilización al sector comercial y residencial sobre los horarios de recolección del operador y manejo adecuado de espacio publico",
        "observacion": ""
      },
      {
        "tipo": "Otra acción necesaria:  PAC puesto de atención comunitaria, presencia alcaldía en el sector",
        "fechas": "15/10 , 21/10 (llantaton), 27/10",
        "actividad": "Realizar presencia en el sector, con el fin de atender en línea las afectaciones del punto por arrojo de residuos y mal uso del espacio público, así como atención a la comunidad alrededor con el fin de atender Quejas. Abordaje a carreteros y jornada de llantaton.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1010063-14",
    "uaespId": "1010063",
    "ld": "Usaquén",
    "d": "CARRERA 15 CALLE 163A",
    "estadoSeleccion": "Marcado con X",
    "problematica": "Al tratarse de una zona verde colindante con un cuerpo de agua, el sector se ha consolidado como un foco crítico de disposición incontrolada e inadecuada de residuos. Esta problemática se ve agudizada por la convergencia de múltiples actores entre ellos ciudadanos habitantes de calle, residentes de la zona, población flotante, carreteros y recicladores informales, quienes de forma reiterada  arrojan escombros, llantas usadas y todo tipo de desechos sólidos.",
    "responsable": "Laura Vargas Guzmán - Alusa Ambiente",
    "contacto": "3166949334 – laura.vargasg@gobiernobogota.gov.co",
    "puntosFicha": "1010062 – CALLE 161 CON CARRERA 8; 1010099 – CARRERA 7 CON CALLE 187 B - COSTADO ORIENTAL; 1010063 – CARRERA 15 CALLE 163A; 1010100 – AUTOPISTA NORTE CON CALLE 170; 1010067 – CARRERA 4 (AMBOS COSTADOS) CON CALLE 189 B",
    "lat": 4.7418,
    "lng": -74.0385,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "23/10/2026\n24/10/2026",
        "actividad": "Intervención física del punto por medio de instalación de materas, jornada de limpieza y adopción del punto por parte de la comunidad",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "22/09/2026",
        "actividad": "Jornada de Caza Infractores",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "16/10/2026",
        "actividad": "Se realizará jornada informativa en articulación con SDM con el fin de mitigar la ocupación del espacio público por mal parqueo.",
        "observacion": ""
      },
      {
        "tipo": "Levantamiento de estructuras no convencionales",
        "fechas": "01/10/2026",
        "actividad": "Se realizó operativo de levantamiento de estructuras no convencionales sobre el tramo afectado logrando la recolección de 10Mts3 de residuos",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1150338-15",
    "uaespId": "1150338",
    "ld": "Antonio Nariño",
    "d": "AVENIDA CARACAS CON CALLE 12 SUR",
    "estadoSeleccion": "Marcado con X",
    "problematica": "En el punto se evidencia inadecuada disposición de residuos sólidos, así como la presencia de carreteros y estructuras no convencionales, generando afectaciones al espacio público y condiciones que requieren seguimiento y atención institucional..",
    "responsable": "Natalia Rozo – Referente Ambiental",
    "contacto": "3152590622 -natalia.rozo@gobiernobogota.gov.co- yanis.prieto@gobiernobogota.gov.co",
    "puntosFicha": "1150243 – CALLE 1 ENTRE CARRERA 14 B Y CARRERA 16; 1150263 – AVENIDA CALLE 22 SUR 15 SOBRE SEPARADOR; 1150261 – AVENIDA CALLE 22 SUR 11; 1150338 – AVENIDA CARACAS CON CALLE 12 SUR",
    "lat": 4.5858,
    "lng": -74.0932,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "22/10/2026",
        "actividad": "Se  retirar residuos acumulados y estructuras no convencionales.",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "28/10/2026",
        "actividad": "Jornada de Cazainfractores",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla"
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "15/10//2026-26/10/2026",
        "actividad": "Se realiza sensibilizacion para orientar a residentes y comercios sobre horarios, separación y disposición adecuada. Tambien lineas de reporte.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1140295-16",
    "uaespId": "1140295",
    "ld": "Los Mártires",
    "d": "CARRERA 17 ENTRE CALLES 13 Y 18",
    "estadoSeleccion": "Marcado con X (cuadro de texto superpuesto)",
    "problematica": "Acumulación y disposición inadecuada de residuos, presencia de habitantes de calle y estructuras no convencionales. Se presentan además condiciones asociadas a seguridad y ocupación inadecuada del espacio público.",
    "responsable": "Natalia Becerra- Referente Ambienta",
    "contacto": "3163662106- natalia.becerra@gobiernobogota.gov.co",
    "puntosFicha": "1140290 – CALLE 13 15; 1140296 – CALLE 19 15; 1140295 – CARRERA 17 ENTRE CALLES 13 Y 18; 1140297 – CALLE 22 18",
    "lat": 4.6085,
    "lng": -74.0842,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "27/10/2026",
        "actividad": "Se realizará desmonte de estructuras no convencionales, limpieza, pintura de un muro, siembra",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "06/10/2026, 20/10/2026",
        "actividad": "Recorrido de IVC reporte de puntos de acumulación y seguimiento de recolección",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "27/10/2026",
        "actividad": "Se realizará en el sector comercial junto con SDA, SUBRED CO, LIME Sensibilización sobre adecuada disposición de residuos solidos",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1120451-17",
    "uaespId": "1120451",
    "ld": "Barrios Unidos",
    "d": "PARQUE LA ESTACIÓN — CARRERA 24 CON AV. CALLE 72",
    "estadoSeleccion": "Selección no identificada en tabla",
    "problematica": "Problemática asociada a la presencia de carreteros y CHC: Separación de residuos y arrojo en el Parque La Estación y presencia permanente de CHC, quienes pernoctan y consumen sustancias en el espacio público. Al respecto, se vienen adelantando acciones de rehabilitación y recuperación del espacio público.",
    "responsable": "Margarita Mayorga – Referente ambiental",
    "contacto": "3143252871 – margarita.mayorga@gobiernobogota.gov.co",
    "puntosFicha": "1120451 – CARRERA 24 AVENIDA CALLE 72; 1120640 – AVENIDA CALLE 68 CARRERA 18; 1120453 – CARRERA 22 AVENIDA CALLE 68",
    "lat": 4.663,
    "lng": -74.0672,
    "acciones": [
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "19/10",
        "actividad": "Jornada caza infractores.",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "14/10, 29/10",
        "actividad": "Jornada de limpieza, sensibilización (residuos y tenencia responsable de animales de compañía) y embellecimiento.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1080391-18",
    "uaespId": "1080391",
    "ld": "Kennedy",
    "d": "AVENIDA CIUDAD DE CALI DE CALLE 42B BIS SUR A CALLE 42F BIS - COSTADO ORIENTAL",
    "estadoSeleccion": "Marcado con X (cuadro de texto superpuesto)",
    "problematica": "Arrojo clandestino por parte de carreteros informales con reincidencia después de la recolección.",
    "responsable": "3166183553",
    "contacto": "3166183553",
    "puntosFicha": "1080360 – CARRERA 72J BIS CON CALLE 37B SUR; 1080391 – AVENIDA CIUDAD DE CALI DE CALLE 42B BIS SUR A CALLE 42F BIS - COSTADO ORIENTAL; 1080375 – CARRERA 78 CON CALLE 6H",
    "lat": 4.6264,
    "lng": -74.1667,
    "acciones": [
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "22/10,  29/10",
        "actividad": "Efectuar recorridos de control, verificar infractores y aplicar las medidas correspondientes.",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1020075-19",
    "uaespId": "1020075",
    "ld": "Chapinero",
    "d": "CARRERA 13A CON CALLE 97 A",
    "estadoSeleccion": "Marcado con X",
    "problematica": "Se evidencia la disposición inadecuada de residuos mixtos en el sector, entre los cuales se encuentran residuos de construcción y demolición, llantas y otros residuos voluminosos, así como residuos domiciliarios. Adicionalmente, recicladores de oficio realizan actividades de separación y clasificación de material aprovechable directamente en el espacio público. Esta situación genera afectación en el entorno del parque, debido a la permanencia temporal de residuos y materiales durante el proceso de selección. Por lo anterior, se identifica una problemática asociada tanto a la disposición inadecuada de residuos como al uso del espacio público para actividades de separación de material reciclable",
    "responsable": "JIMMY JADEDT",
    "contacto": "3147773425/ingecampambiental@gmail.com Ambiente.chapinero@gobiernobogota.gov.co",
    "puntosFicha": "1020073 – AVENIDA CARACAS CON CALLE 40 C; 1020075 – CARRERA 13A CON CALLE 97 A",
    "lat": 4.6816,
    "lng": -74.0477,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "29 /10/2026",
        "actividad": "Jornada de limpieza  y aseo",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "23/10/2026",
        "actividad": "Caza-infractores",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "21/10/2026",
        "actividad": "Jornada de sensibilización puerta a puerta",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1100565-20",
    "uaespId": "1100565",
    "ld": "Engativá",
    "d": "CALLE 64 CARRERA 113F (y Carrera 119A # 70A Bis)",
    "estadoSeleccion": "Marcado con X (cuadro de texto superpuesto)",
    "problematica": "Ejemplo: disposición frecuente de residuos ordinarios y escombros junto al canal, con reincidencia después de la recolección.",
    "responsable": "Fernanda Villamil",
    "contacto": "3209847669- Diana.villamil@gobiernobogota.gov.co",
    "puntosFicha": "1100516 – CARRERA 91 ENTRE CALLE 97 Y AVENIDA CIUDAD DE CALI AMBOS COSTADOS; 1100565 – CALLE 64 CARRERA 113F",
    "lat": 4.7141,
    "lng": -74.1417,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "08/10, 15/10, 29/10",
        "actividad": "Recorrido e intervención programada en el punto",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Descripción es ejemplo de plantilla; Problemática textual es ejemplo de plantilla"
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "16/10",
        "actividad": "Caza infractores",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Problemática textual es ejemplo de plantilla"
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "13/10",
        "actividad": "Sensibilización adecuado manejo de residuos, horarios y frecuencias del operador",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Problemática textual es ejemplo de plantilla"
      },
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "02/10,",
        "actividad": "Inicio de intervencion: Renaturalizar",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Problemática textual es ejemplo de plantilla"
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "05/10,",
        "actividad": "Caza infractores",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Problemática textual es ejemplo de plantilla"
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "14/10,",
        "actividad": "Sensibilización adecuado manejo de residuos, horarios y frecuencias del operador",
        "observacion": "Acción con fecha o descripción, pero sin X en la casilla; Problemática textual es ejemplo de plantilla"
      }
    ]
  },
  {
    "id": "UAESP-1090441-22",
    "uaespId": "1090441",
    "ld": "Fontibón",
    "d": "AVENIDA CIUDAD DE CALI CON CALLE 24D INTERSECCION PARA TOMAR LA AVENIDA LA ESPERANZA",
    "estadoSeleccion": "Marcado con X",
    "problematica": "DISPOSICION INADECUADA DE RESIDUOS SOLIDOS EN ESPECIAL ORDINARIOS Y VOLUMINOSOS, ADEMAS SE EVIDENCIA PRESENCIA DE CAMBUCHES.",
    "responsable": "ALEJANDRA MENDEZ-LIDER AMBIENTE IVC",
    "contacto": "3102033904-ALEJANDRA.MENDEZN@GOBIERNOBOGOTA.GOV.CO",
    "puntosFicha": "1090441 – AVENIDA CIUDAD DE CALI CON CALLE 24D INTERSECCION PARA TOMAR LA AVENIDA LA ESPERANZA",
    "lat": 4.672,
    "lng": -74.1254,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "28/10",
        "actividad": "Realizar jornada de embellecimiento",
        "observacion": ""
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "28/10",
        "actividad": "Hacer recorridos de control e imponer medidad correcctivas",
        "observacion": ""
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "30/10",
        "actividad": "Orientas a transeuntes sobre adecuada disposicion de residuos y horarios de recoleccion",
        "observacion": ""
      }
    ]
  },
  {
    "id": "UAESP-1170061-23",
    "uaespId": "1170061",
    "ld": "La Candelaria",
    "d": "CALLE 9 CARRERA 4 ESTE",
    "estadoSeleccion": "Punto único en la ficha (sin X explícita)",
    "problematica": "Se evidencia una disposición de residuos contra frecuencia, principalmente en horas de la tarde y noche, pese a que la frecuencia de recolección en el sector corresponde a los días martes, jueves y sábados en horas de la mañana. Adicionalmente, las vías aledañas, Carrera 4 Este y Calle 9 Bis, son peatonales, condición que dificulta la recolección de los residuos por parte del prestador del servicio y genera que la comunidad los deje desde la noche anterior. También se evidencia la disposición de residuos voluminosos en el punto.\nEsta situación requiere intervención debido a que corresponde al único punto crítico de residuos identificado por la UAESP en la localidad de La Candelaria, por lo que es necesario fortalecer las acciones de sensibilización, seguimiento y control para prevenir la acumulación recurrente de residuos en el espacio público.",
    "responsable": "María Camila Carreño - FDLC Ambiente",
    "contacto": "350 5977500 – mariac.carreno@gobiernobogota.gov.co",
    "puntosFicha": "1170061 – CALLE 9 CARRERA 4 ESTE",
    "lat": 4.5895,
    "lng": -74.0706,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "29 de octubre",
        "actividad": "Jornada de embellecimiento y apropiación ambiental del punto",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "16 de octubre",
        "actividad": "Jornada de sensibilización sobre manejo adecuado de residuos y normativa ambiental vigente.",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      }
    ]
  },
  {
    "id": "UAESP-1130278-24",
    "uaespId": "1130278",
    "ld": "Teusaquillo",
    "d": "CARRERA 24 CALLE 47, ESQUINA COLEGIO PALERMO",
    "estadoSeleccion": "Punto único en la ficha (sin X explícita)",
    "problematica": "Se presenta disposición inadecuada de residuos domésticos en horarios y puntos no autorizados, así como disposición ocasional de RCD y residuos voluminosos. Esta situación evidencia reincidencia, incluso después de realizar la recolección y atención del punto, generando nuevamente acumulación de residuos en el sector.",
    "responsable": "Juan David Becerra – Gestion Policiva",
    "contacto": "3103132186 – juand.becerra@gobiernobogota.gov.co",
    "puntosFicha": "1130278 – CARRERA 24 CALLE 47, ESQUINA COLEGIO PALERMO",
    "lat": 4.6357,
    "lng": -74.075,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "14/10",
        "actividad": "Limpieza del punto e instalación de señaletica",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "Sujeto a disponibilidad E13",
        "actividad": "Operativos verificación art 94 ley 1801  separación de residuos y caza  infractores.",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "13/10 , 20/10 , 27/10",
        "actividad": "Pedagogogia dirigida a establecimientos de comercio y comunidad sobre manejo integral de residuos",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Otra acción necesaria: [indique cuál]",
        "fechas": "29/10",
        "actividad": "Taller ecoambiental Colegio Palermo",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      }
    ]
  },
  {
    "id": "UAESP-1060186-25",
    "uaespId": "1060186",
    "ld": "Tunjuelito",
    "d": "DIAGONAL 59 B SUR CARRERA 19 A",
    "estadoSeleccion": "Punto único en la ficha (sin X explícita)",
    "problematica": "Disposición frecuente e inadecuada de residuos voluminosos, residuos de construcción y demolición y residuos de curtiembres en inmediaciones de la quebrada Chiguaza, con presencia recurrente de estos residuos incluso después de las jornadas de recolección.",
    "responsable": "Vanessa Valbuena",
    "contacto": "3142640132- vanesa.valbuena@gobiernobogota.gov.co",
    "puntosFicha": "1060186 – DIAGONAL 59 B SUR CARRERA 19 A",
    "lat": 4.5593,
    "lng": -74.144,
    "acciones": [
      {
        "tipo": "Intervención o recuperación del punto",
        "fechas": "29/10",
        "actividad": "Jornada articulada de lImpieza, recolección de residuos y embellecimiento",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Operativo de inspección, vigilancia y control (IVC)",
        "fechas": "22/10, fecha tentativa sujeto a disponibilidad",
        "actividad": "hacer recorridos de control, verificar infracciones y aplicar las medidas correspondientes.",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      },
      {
        "tipo": "Sensibilización o pedagogía",
        "fechas": "15/10, 20/10",
        "actividad": "Orientar a residentes y establecimientos  sobre horarios, separación y disposición adecuada.",
        "observacion": "Selección por punto único disponible en la ficha; no requiere marca X."
      }
    ]
  }
];

export const GESTION_P04_DEFAULT: GestionP04Datos = {
  "corte": "20 de octubre de 2026",
  "universo": {
    "basePgirs": 478,
    "activosCenso": 292,
    "nuevos": 93,
    "confirmados": 385,
    "enConfirmacion": 96,
    "accionesFocalizadasOct": 21,
    "maximoPosible": 481,
    "trayectoria": [
      {
        "label": "Base 2024",
        "val": 700,
        "h": 112,
        "bg": "#D1D5DB",
        "fg": "#1F2937"
      },
      {
        "label": "Meta 2025",
        "val": 670,
        "h": 107,
        "bg": "#E5E7EB",
        "fg": "#4B5563"
      },
      {
        "label": "Meta 2026",
        "val": 640,
        "h": 102,
        "bg": "#FFCD00",
        "fg": "#1F2937"
      },
      {
        "label": "Meta 2027 (600)",
        "val": 600,
        "h": 96,
        "bg": "#16A34A",
        "fg": "#16A34A"
      },
      {
        "label": "Confirmado (385)",
        "val": 385,
        "h": 61,
        "bg": "#E3002B",
        "fg": "#E3002B"
      },
      {
        "label": "Máximo posible",
        "val": 481,
        "h": 77,
        "bg": "#FFFBEB",
        "fg": "#B45309",
        "border": "1px dashed #F59E0B"
      }
    ]
  },
  "resultado": {
    "ivcOperativos": 1514,
    "ivcMeta": 1000,
    "ivcPct": 151,
    "ivcComparendos": 260,
    "ivcPuntosCriticos": 834,
    "ivcCambuches": 433,
    "sensParticipantes": 19048,
    "sensMeta": 15000,
    "sensPct": 127,
    "sensRegistros": 903,
    "sensPromedio": 21,
    "sensLocalidades": 20
  },
  "gestion": {
    "puntosDistintos50m": 1287,
    "intervencionesReportadas": 1983,
    "intervencionesAgrupables": 1837,
    "intervencionesNivelBarrio": 146,
    "diametroMaxM": 138,
    "puntosUnaVisita": 1013,
    "puntosUnaVisitaPct": 79,
    "puntosAltaRecurrencia": 24,
    "residuosRecolectados": 14111,
    "cambuchesRetirados": 1480,
    "intervencionesConCambuches": 334,
    "areaRecuperadaM2": 181264,
    "serieMensual": [
      {
        "m": "Ene",
        "i": 9,
        "p": 9
      },
      {
        "m": "Feb",
        "i": 154,
        "p": 123
      },
      {
        "m": "Mar",
        "i": 291,
        "p": 218
      },
      {
        "m": "Abr",
        "i": 286,
        "p": 226
      },
      {
        "m": "May",
        "i": 278,
        "p": 231
      },
      {
        "m": "Jun",
        "i": 224,
        "p": 183
      },
      {
        "m": "Jul",
        "i": 238,
        "p": 194
      },
      {
        "m": "Ago",
        "i": 226,
        "p": 191
      },
      {
        "m": "Sep",
        "i": 190,
        "p": 151
      },
      {
        "m": "Oct",
        "i": 82,
        "p": 78
      }
    ],
    "tiposIntervencion": [
      {
        "t": "Campaña de sensibilización",
        "n": 903,
        "w": 100,
        "c": "#FFCD00",
        "sub": "46% de los registros · 19.048 participantes"
      },
      {
        "t": "Recolección de residuos",
        "n": 734,
        "w": 81,
        "c": "#1F2937",
        "sub": "37% de los registros · 10.269 de los residuos"
      },
      {
        "t": "Campañas de apropiación",
        "n": 346,
        "w": 38,
        "c": "#9CA3AF",
        "sub": "17% de los registros · 2.154 participantes"
      }
    ]
  },
  "rankingLocalidad": [
    {
      "loc": "San Cristóbal",
      "i": 546,
      "ag": 545,
      "p": 343,
      "t": 662,
      "camb": 68,
      "m2": 17896
    },
    {
      "loc": "Puente Aranda",
      "i": 364,
      "ag": 246,
      "p": 141,
      "t": 2611.7,
      "camb": 95,
      "m2": 6987
    },
    {
      "loc": "Usaquén",
      "i": 101,
      "ag": 100,
      "p": 70,
      "t": 647.5,
      "camb": 110,
      "m2": 10517
    },
    {
      "loc": "Los Mártires",
      "i": 101,
      "ag": 101,
      "p": 73,
      "t": 1030,
      "camb": 261,
      "m2": 34324
    },
    {
      "loc": "Engativá",
      "i": 98,
      "ag": 98,
      "p": 87,
      "t": 186,
      "camb": 81,
      "m2": 1921
    },
    {
      "loc": "La Candelaria",
      "i": 87,
      "ag": 64,
      "p": 40,
      "t": 42,
      "camb": 6,
      "m2": 667
    },
    {
      "loc": "Suba",
      "i": 80,
      "ag": 80,
      "p": 65,
      "t": 1157.9,
      "camb": 129,
      "m2": 38485
    },
    {
      "loc": "Antonio Nariño",
      "i": 68,
      "ag": 68,
      "p": 34,
      "t": 922.2,
      "camb": 120,
      "m2": 7027
    },
    {
      "loc": "Kennedy",
      "i": 68,
      "ag": 68,
      "p": 51,
      "t": 2955,
      "camb": 163,
      "m2": 44007
    },
    {
      "loc": "Teusaquillo",
      "i": 61,
      "ag": 61,
      "p": 37,
      "t": 311,
      "camb": 210,
      "m2": 5175
    },
    {
      "loc": "Ciudad Bolívar",
      "i": 57,
      "ag": 57,
      "p": 45,
      "t": 963,
      "camb": 49,
      "m2": 2645
    },
    {
      "loc": "Bosa",
      "i": 56,
      "ag": 56,
      "p": 51,
      "t": 462,
      "camb": 3,
      "m2": 164
    },
    {
      "loc": "Santa Fe",
      "i": 54,
      "ag": 54,
      "p": 48,
      "t": 1331.5,
      "camb": 81,
      "m2": 5267
    },
    {
      "loc": "Chapinero",
      "i": 48,
      "ag": 48,
      "p": 43,
      "t": 19,
      "camb": 3,
      "m2": 157
    },
    {
      "loc": "Usme",
      "i": 47,
      "ag": 46,
      "p": 42,
      "t": 296.5,
      "camb": 4,
      "m2": 1080
    },
    {
      "loc": "Tunjuelito",
      "i": 42,
      "ag": 41,
      "p": 35,
      "t": 165,
      "camb": 27,
      "m2": 1068
    },
    {
      "loc": "Rafael Uribe Uribe",
      "i": 42,
      "ag": 41,
      "p": 37,
      "t": 155.4,
      "camb": 64,
      "m2": 1223
    },
    {
      "loc": "Barrios Unidos",
      "i": 34,
      "ag": 34,
      "p": 28,
      "t": 58,
      "camb": 4,
      "m2": 1305
    },
    {
      "loc": "Fontibón",
      "i": 25,
      "ag": 25,
      "p": 21,
      "t": 132.6,
      "camb": 2,
      "m2": 890
    },
    {
      "loc": "Sumapaz",
      "i": 4,
      "ag": 4,
      "p": 1,
      "t": 3,
      "camb": 0,
      "m2": 457
    }
  ]
};
