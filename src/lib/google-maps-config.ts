// Shared Google Maps configuration to avoid loading conflicts
// All components using Google Maps should import this config

export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export const GOOGLE_MAPS_OPTIONS = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  language: 'th',
  libraries: GOOGLE_MAPS_LIBRARIES,
};
