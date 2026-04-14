// src/components/shared/Input.jsx
import React from 'react';
import './Input.css';

export default function Input({ label, error, icon, ...props }) {
  return (
    <div className={`input-group${error ? ' input-group--error' : ''}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrap">
        {icon && <span className="input-icon">{icon}</span>}
        <input className={`input-field${icon ? ' input-field--icon' : ''}`} {...props} />
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
