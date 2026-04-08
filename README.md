# Transformación Institucional - Monorepo

Este repositorio contiene el sistema de Seguimiento de Planes de Transformación Institucional.

## Entregable 1: Diagrama de Entidad Relación (ERD)

A continuación, el diagrama ERD generado en formato Mermaid que representa la estructura de la base de datos PostgreSQL mediante Prisma, incluyendo el modelo de roles local:

```mermaid
erDiagram
    Plan ||--o{ ObjetivoEstrategico : contiene
    ObjetivoEstrategico ||--o{ Programa : se_divide_en
    Programa ||--o{ Hito : tiene
    Hito ||--o{ Actividad : incluye
    
    Actividad ||--o{ AsignacionLocalidad : asignada_a
    Localidad ||--o{ AsignacionLocalidad : pertenece_a
    Usuario ||--o{ AsignacionLocalidad : responsable
    
    Actividad ||--o{ SubTarea : tiene
    Actividad ||--o{ Evidencia : requiere
    Localidad ||--o{ Evidencia : aporta
    Usuario ||--o{ Evidencia : subida_por
    
    Actividad ||--o{ Comentario : recibe
    Localidad ||--o{ Comentario : acerca_de
    Usuario ||--o{ Comentario : escrito_por
    
    Actividad ||--o{ Alerta : dispara
    Localidad ||--o{ Alerta : afecta_a
    Usuario ||--o{ Alerta : resuelta_por
    
    Usuario ||--o{ Localidad : es_responsable_principal

    Plan {
        String id PK
        String nombre
        Int ano
        String descripcion
        EstadoPlan estado
    }

    Usuario {
        String id PK
        String email UK
        String nombre
        RolUsuario rol
    }

    Actividad {
        String id PK
        String codigoCompleto UK
        String nombre
        DateTime fechaInicio
        DateTime fechaLimite
        Prioridad prioridad
        Float indicadorMeta
        EstadoActividad estado
    }
    
    Evidencia {
        String id PK
        String tipoEvidencia
        String nombreArchivo
        String urlArchivo
        Boolean verificadaPorAdmin
    }
    
    Alerta {
        String id PK
        TipoAlerta tipo
        NivelAlerta nivel
        Boolean activa
    }
```

## Estructura del Proyecto

* `/backend`: Aplicación Express.js (REST API), Prisma ORM (PostgreSQL), MSAL Nodo (JWT validation), Tareas automáticas.
* `/frontend`: Aplicación React (Vite, Tailwind, Shadcn/UI, MSAL React) para el Dashboard y Kanban.
