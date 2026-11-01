// Data for Pokémon types, including their labels and colors
export const TYPES = {
  normal: { label: 'Normal', color: '#a8a77a' },
  fire: { label: 'Fuego', color: '#ee8130' },
  water: { label: 'Agua', color: '#6390f0' },
  electric: { label: 'Eléctrico', color: '#f7d02c' },
  grass: { label: 'Planta', color: '#7ac74c' },
  ice: { label: 'Hielo', color: '#96d9d6' },
  fighting: { label: 'Lucha', color: '#c22e28' },
  poison: { label: 'Veneno', color: '#a33ea1' },
  ground: { label: 'Tierra', color: '#e2bf65' },
  flying: { label: 'Volador', color: '#a98ff3' },
  psychic: { label: 'Psíquico', color: '#f95587' },
  bug: { label: 'Bicho', color: '#a6b91a' },
  rock: { label: 'Roca', color: '#b6a136' },
  ghost: { label: 'Fantasma', color: '#735797' },
  dragon: { label: 'Dragón', color: '#6f35fc' },
  dark: { label: 'Siniestro', color: '#705746' },
  steel: { label: 'Acero', color: '#b7b7ce' },
  fairy: { label: 'Hada', color: '#d685ad' },
};

// Spanish labels for the fields of an evolution's details (evolution_details); their order is the order on screen
export const DETAIL_LABELS = {
  version_group: 'Juego', trigger: 'Método', min_level: 'Nivel', item: 'Objeto', held_item: 'Objeto equipado',
  known_move: 'Movimiento aprendido', known_move_type: 'Tipo de movimiento aprendido', used_move: 'Movimiento usado',
  min_move_count: 'Veces', min_happiness: 'Amistad mínima', min_affection: 'Afecto mínimo', min_beauty: 'Belleza mínima',
  min_damage_taken: 'Daño mínimo recibido', min_steps: 'Pasos', location: 'Lugar', region: 'Región',
  party_species: 'Pokémon en el equipo', party_type: 'Tipo en el equipo', trade_species: 'A cambio de', gender: 'Sexo',
  time_of_day: 'Momento del día', relative_physical_stats: 'Ataque frente a Defensa', allowed_natures: 'Naturalezas',
  near_special_rock: 'Cerca de una roca especial', needs_overworld_rain: 'Lluvia', turn_upside_down: 'Consola boca abajo',
  needs_multiplayer: 'Multijugador', condition_expression: 'Condición',
  required_pokemon_form: 'Forma requerida', evolved_pokemon_form: 'Forma resultante',
};

// PokeAPI has no Spanish names for these evolution detail fields, so they are not fetched
export const UNTRANSLATED = new Set(['trigger', 'location', 'region', 'required_pokemon_form', 'evolved_pokemon_form']);