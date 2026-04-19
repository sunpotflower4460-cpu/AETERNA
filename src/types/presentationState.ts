/**
 * Presentation State Types
 *
 * Defines visualization and UI state for rendering the organism.
 * This includes camera, renderer, visual layers, debug UI, and graphics mode.
 *
 * Presentation state is OBSERVER-SIDE - it controls how the organism
 * is displayed and visualized, not the organism's internal dynamics.
 */

/**
 * Camera state for 3D visualization
 */
export interface PresentationCameraState {
  /** Camera position [x, y, z] */
  position: [number, number, number];
  /** Camera target/lookAt point [x, y, z] */
  target: [number, number, number];
  /** Camera zoom/distance factor */
  zoom: number;
  /** Camera rotation angles [theta, phi] */
  rotation: [number, number];
}

/**
 * Visual layer display state
 */
export interface PresentationVisualLayer {
  /** Layer name/ID */
  name: string;
  /** Whether layer is visible */
  visible: boolean;
  /** Layer opacity (0-1) */
  opacity: number;
  /** Layer-specific rendering parameters */
  params?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Debug UI state
 */
export interface PresentationDebugState {
  /** Whether debug panel is visible */
  debugPanelVisible: boolean;
  /** Which debug panels are expanded */
  expandedPanels: Set<string>;
  /** Guide panel visibility */
  guidePanelVisible: boolean;
  /** Metrics UI update rate (fps) */
  metricsUpdateRate: number;
}

/**
 * Graphics rendering mode
 */
export type GraphicsMode =
  | 'torus-network'
  | 'reality-layer'
  | 'minimal'
  | 'headless';

/**
 * Render buffer state (for visualization only)
 */
export interface PresentationRenderBuffers {
  /** Vertex positions for rendering */
  vertexPositions: Float32Array;
  /** Vertex colors for rendering */
  colors: Float32Array;
  /** Vertex normals for lighting */
  normals: Float32Array;
  /** Whether buffers need update */
  needsUpdate: boolean;
}

/**
 * Complete presentation state
 */
export interface PresentationState {
  /** Camera state */
  camera: PresentationCameraState;
  /** Active visual layers */
  visualLayers: PresentationVisualLayer[];
  /** Debug UI state */
  debug: PresentationDebugState;
  /** Current graphics mode */
  graphicsMode: GraphicsMode;
  /** Render buffers */
  renderBuffers: PresentationRenderBuffers;
  /** Last render timestamp */
  lastRenderTime: number;
}

/**
 * Create initial presentation state
 */
export function createInitialPresentationState(): PresentationState {
  return {
    camera: {
      position: [0, 0, 50],
      target: [0, 0, 0],
      zoom: 1.0,
      rotation: [0, 0],
    },
    visualLayers: [
      { name: 'torus', visible: true, opacity: 1.0 },
      { name: 'reality', visible: false, opacity: 0.7 },
    ],
    debug: {
      debugPanelVisible: true,
      expandedPanels: new Set(['metrics']),
      guidePanelVisible: true,
      metricsUpdateRate: 15,
    },
    graphicsMode: 'torus-network',
    renderBuffers: {
      vertexPositions: new Float32Array(0),
      colors: new Float32Array(0),
      normals: new Float32Array(0),
      needsUpdate: false,
    },
    lastRenderTime: 0,
  };
}
