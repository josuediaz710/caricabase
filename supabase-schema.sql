-- Run this script once in Supabase Dashboard > SQL Editor.
-- It stores the existing editable table model as one shared JSON document.
-- Only authenticated project users can read or update it.

create table if not exists public.caricabase_state (
  singleton boolean primary key default true check (singleton),
  payload jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.caricabase_state enable row level security;

drop policy if exists "Team can read CaricaBase state" on public.caricabase_state;
create policy "Team can read CaricaBase state"
  on public.caricabase_state
  for select
  to authenticated
  using (true);

drop policy if exists "Team can update CaricaBase state" on public.caricabase_state;
create policy "Team can update CaricaBase state"
  on public.caricabase_state
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

grant usage on schema public to authenticated;
revoke all on public.caricabase_state from anon, authenticated;
grant select, update on public.caricabase_state to authenticated;

create or replace function public.save_caricabase_state(
  p_payload jsonb,
  p_expected_version bigint
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_version bigint;
begin
  update public.caricabase_state
  set payload = p_payload,
      version = version + 1,
      updated_at = now()
  where singleton = true
    and version = p_expected_version
  returning version into updated_version;

  return updated_version;
end;
$$;

revoke all on function public.save_caricabase_state(jsonb, bigint) from public, anon;
grant execute on function public.save_caricabase_state(jsonb, bigint) to authenticated;

insert into public.caricabase_state (singleton, payload, version)
values (
  true,
  $state$
  {
    "version": 1,
    "activeTableId": "fruta",
    "tables": [
      {
        "id": "fruta",
        "name": "Fruta",
        "columns": [
          {"id":"id_fruta","name":"ID fruta","type":"text"},
          {"id":"nom_fruta","name":"Nombre","type":"text"},
          {"id":"clasificacion","name":"Clasificación","type":"text"}
        ],
        "rows": [
          {"id_fruta":"F-01","nom_fruta":"Papaya","clasificacion":"Fruta tropical"}
        ]
      },
      {
        "id": "variedad",
        "name": "Variedad",
        "columns": [
          {"id":"id_variedad","name":"ID variedad","type":"text"},
          {"id":"nom_variedad","name":"Variedad","type":"text"},
          {"id":"color_predominante","name":"Color predominante","type":"text"},
          {"id":"id_fruta","name":"ID fruta","type":"text"}
        ],
        "rows": [
          {"id_variedad":"V-01","nom_variedad":"Maradol","color_predominante":"Por registrar","id_fruta":"F-01"},
          {"id_variedad":"V-02","nom_variedad":"Tainung","color_predominante":"Por registrar","id_fruta":"F-01"},
          {"id_variedad":"V-03","nom_variedad":"Solo","color_predominante":"Por registrar","id_fruta":"F-01"}
        ]
      },
      {
        "id": "maquina",
        "name": "Máquina",
        "columns": [
          {"id":"id_maquina","name":"ID máquina","type":"text"},
          {"id":"nom_maquina","name":"Nombre","type":"text"},
          {"id":"tipo_maquina","name":"Tipo","type":"text"},
          {"id":"marca","name":"Marca","type":"text"},
          {"id":"modelo","name":"Modelo","type":"text"},
          {"id":"capacidad_kg","name":"Capacidad (kg)","type":"number"},
          {"id":"temperatura_max_c","name":"Temperatura máx. (°C)","type":"number"}
        ],
        "rows": []
      },
      {
        "id": "preparacion",
        "name": "Preparación",
        "columns": [
          {"id":"id_preparacion","name":"ID preparación","type":"text"},
          {"id":"peso_fruta_total_g","name":"Peso de fruta (g)","type":"number"},
          {"id":"cantidad_frutas","name":"Cantidad de frutas","type":"number"},
          {"id":"merma_preparacion_g","name":"Merma (g)","type":"number"},
          {"id":"pelado","name":"Pelado","type":"text"},
          {"id":"tipo_corte","name":"Tipo de corte","type":"text"},
          {"id":"tratamiento_previo","name":"Tratamiento previo","type":"text"},
          {"id":"id_variedad","name":"ID variedad","type":"text"}
        ],
        "rows": []
      },
      {
        "id": "experimento",
        "name": "Experimento",
        "columns": [
          {"id":"id_experimento","name":"ID experimento","type":"text"},
          {"id":"fecha_experimento","name":"Fecha","type":"date"},
          {"id":"hora_inicio","name":"Hora de inicio","type":"time"},
          {"id":"hora_fin","name":"Hora de finalización","type":"time"},
          {"id":"temperatura_trabaj","name":"Temperatura de trabajo (°C)","type":"number"},
          {"id":"observaciones","name":"Observaciones","type":"text"},
          {"id":"id_maquina","name":"ID máquina","type":"text"}
        ],
        "rows": []
      },
      {
        "id": "muestra",
        "name": "Muestra",
        "columns": [
          {"id":"id_muestra","name":"ID muestra","type":"text"},
          {"id":"peso_inicial_g","name":"Peso inicial (g)","type":"number"},
          {"id":"grado_madurez","name":"Grado de madurez","type":"text"},
          {"id":"estado_fruta","name":"Estado de la fruta","type":"text"},
          {"id":"fecha_preparacion","name":"Fecha de preparación","type":"date"},
          {"id":"id_preparacion","name":"ID preparación","type":"text"},
          {"id":"id_experimento","name":"ID experimento","type":"text"}
        ],
        "rows": []
      },
      {
        "id": "medicion",
        "name": "Medición",
        "columns": [
          {"id":"id_medicion","name":"ID medición","type":"text"},
          {"id":"hora_medicion","name":"Hora de medición","type":"time"},
          {"id":"tiempo_transcurrido_min","name":"Tiempo transcurrido (min)","type":"number"},
          {"id":"peso_g","name":"Peso (g)","type":"number"},
          {"id":"id_experimento","name":"ID experimento","type":"text"},
          {"id":"id_muestra","name":"ID muestra","type":"text"}
        ],
        "rows": []
      }
    ]
  }
  $state$::jsonb,
  1
)
on conflict (singleton) do nothing;
