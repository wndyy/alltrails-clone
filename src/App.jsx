import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './App.css'

const STADIA_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_CENTER = [-98.5795, 39.8283] // geographic center of USA
const DEFAULT_ZOOM = 4

export default function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState(null)
  const [showTrails, setShowTrails] = useState(true)
  const [showTrails, setShowTrails] = useState(true)

useEffect(() => {
  if (map.current) return
  map.current = new maplibregl.Map({
    container: mapContainer.current,
    style: STADIA_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  })
  map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right')

  map.current.on('load', () => {
    map.current.addSource('trails', {
      type: 'raster',
      tiles: ['https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://waymarkedtrails.org">Waymarked Trails</a>',
    })
    map.current.addLayer({
      id: 'trails',
      type: 'raster',
      source: 'trails',
      paint: { 'raster-opacity': 0.85 },
    })
  })

  return () => {
    map.current?.remove()
    map.current = null
  }
  }, [])

useEffect(() => {
  if (!map.current) return
  const style = map.current.getStyle()
  if (!style) return
  const layerExists = style.layers?.some(l => l.id === 'trails')
  if (!layerExists) return
  map.current.setLayoutProperty('trails', 'visibility', showTrails ? 'visible' : 'none')
}, [showTrails])

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 13,
          duration: 1800,
          essential: true,
        })

        new maplibregl.Marker({ color: '#2D6A4F' })
          .setLngLat([longitude, latitude])
          .addTo(map.current)

        setLocating(false)
      },
      (err) => {
        setError('Could not get your location. Please allow location access.')
        setLocating(false)
        console.error(err)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="app">
      <div ref={mapContainer} className="map" />

      <div className="locate-container">
        <button
          className={`locate-btn ${locating ? 'locating' : ''}`}
          onClick={handleLocate}
          disabled={locating}
          title="Go to my location"
        >
          {locating ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              <circle cx="12" cy="12" r="8" strokeDasharray="2 2"/>
            </svg>
          )}
          {locating ? 'Locating…' : 'My Location'}
        </button>

        {error && <div className="error-toast">{error}</div>}
      </div>
      <div className="trails-toggle">
      <button
        className={`trails-btn ${showTrails ? 'active' : ''}`}
        onClick={() => setShowTrails(v => !v)}
        title="Toggle hiking trails"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 17l4-8 4 4 4-6 4 10"/>
        </svg>
        {showTrails ? 'Hide Trails' : 'Show Trails'}
      </button>
    </div>
    </div>
  )
}
