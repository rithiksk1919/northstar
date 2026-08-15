import React from 'react';
import ReactDOM from 'react-dom/client';
import ResourceMap from './components/ResourceMap';

const rootElement = document.getElementById('react-map-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ResourceMap />
    </React.StrictMode>
  );
}
