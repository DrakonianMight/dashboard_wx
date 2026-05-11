export interface Capital {
  name: string
  country: string
  lat: number
  lng: number
}

export const capitals: Capital[] = [
  // Australia & New Zealand (prioritized)
  { name: "Canberra", country: "Australia", lat: -35.2809, lng: 149.13 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Brisbane", country: "Australia", lat: -27.4698, lng: 153.0251 },
  { name: "Perth", country: "Australia", lat: -31.9505, lng: 115.8605 },
  { name: "Adelaide", country: "Australia", lat: -34.9285, lng: 138.6007 },
  { name: "Hobart", country: "Australia", lat: -42.8821, lng: 147.3272 },
  { name: "Darwin", country: "Australia", lat: -12.4634, lng: 130.8456 },
  { name: "Wellington", country: "New Zealand", lat: -41.2866, lng: 174.7756 },
  { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633 },
  // Asia Pacific
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018 },
  { name: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456 },
  { name: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842 },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.139, lng: 101.6869 },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  // Europe
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  // Americas
  { name: "Washington D.C.", country: "United States", lat: 38.9072, lng: -77.0369 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298 },
  { name: "Ottawa", country: "Canada", lat: 45.4215, lng: -75.6972 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332 },
  { name: "Sao Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
  // Middle East & Africa
  { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219 },
]
