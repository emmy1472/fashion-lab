export interface ArtworkLayer {
  id: string;
  type: 'image' | 'text' | 'graphic';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  view: 'front' | 'back';
  visible: boolean;
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
}

export interface ZoneColor {
  id: string;
  label: string;
  role: 'primary' | 'secondary' | 'accent';
  color: string;
}

export interface DesignState {
  garmentId: string;
  activeView: 'front' | 'back';
  activeAngle: 'front' | 'back' | 'detail';
  zoneColors: Record<string, string>;
  patternSettings: {
    patternId: string;
    scale: number;
    color1: string;
    color2: string;
  };
  layers: ArtworkLayer[];
  selectedLayerId: string | null;
  zoom: number;
}

export interface DesignHistory {
  past: DesignState[];
  present: DesignState;
  future: DesignState[];
}
