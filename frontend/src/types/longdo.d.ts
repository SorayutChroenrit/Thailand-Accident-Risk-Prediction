// Longdo Map TypeScript Declarations
declare namespace longdo {
  class Map {
    constructor(options: {
      placeholder: HTMLElement;
      zoom?: number;
      location?: { lon: number; lat: number };
      language?: string;
      lastView?: boolean;
    });

    location(location: { lon: number; lat: number }, animate?: boolean): void;
    zoom(level: number, animate?: boolean): void;
    bound(options?: { boundUpdate?: boolean; marginHeight?: number; marginWidth?: number }): void;

    Overlays: {
      add(overlay: any): void;
      remove(overlay: any): void;
      clear(): void;
      list(): any[];
    };

    Event: {
      bind(eventName: string, handler: Function): void;
      unbind(eventName: string, handler?: Function): void;
    };

    Route: {
      add(result: any): void;
      clear(): void;
    };

    Search: {
      search(keyword: string, callback: (result: any) => void): void;
      suggest(keyword: string, callback: (result: any[]) => void): void;
    };
  }

  class Marker {
    constructor(location: { lon: number; lat: number }, options?: {
      title?: string;
      detail?: string;
      icon?: any;
      visibleRange?: { min: number; max: number };
      draggable?: boolean;
      weight?: string;
    });

    location(location?: { lon: number; lat: number }): void | { lon: number; lat: number };
    title(text?: string): void | string;
  }

  class Polyline {
    constructor(
      locations: Array<{ lon: number; lat: number }>,
      options?: {
        title?: string;
        detail?: string;
        lineWidth?: number;
        lineColor?: string;
        visibleRange?: { min: number; max: number };
      }
    );
  }

  class Circle {
    constructor(
      location: { lon: number; lat: number },
      radius: number,
      options?: {
        title?: string;
        detail?: string;
        lineWidth?: number;
        lineColor?: string;
        fillColor?: string;
        visibleRange?: { min: number; max: number };
      }
    );
  }

  class Popup {
    constructor(options?: {
      title?: string;
      detail?: string;
      size?: { width: number; height: number };
      closable?: boolean;
    });
  }

  class Geometry {
    static distance(
      location1: { lon: number; lat: number },
      location2: { lon: number; lat: number }
    ): number;
  }
}

// Global longdo object
declare const longdo: typeof longdo;

// Longdo Map constants
declare namespace longdo {
  enum Language {
    Thai = 'th',
    English = 'en'
  }
}

export {};
