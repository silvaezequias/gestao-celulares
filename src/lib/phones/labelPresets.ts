import presetsData from './label-presets.json';

// Biblioteca de medidas pra folha de etiquetas. Editável à mão no arquivo
// label-presets.json — dá pra adicionar novos tamanhos de papel/adesivo
// direto lá, sem mexer em código. Um preset com "locked: true" trava a
// régua (não dá mais pra arrastar) enquanto ele estiver selecionado.
export interface LabelPreset {
  id: string;
  name: string;
  locked: boolean;
  columns: number;
  rows: number;
  marginTopCm: number;
  marginRightCm: number;
  marginBottomCm: number;
  marginLeftCm: number;
  gapRowCm: number;
  gapColCm: number;
}

export const LABEL_PRESETS: LabelPreset[] = presetsData.presets;
