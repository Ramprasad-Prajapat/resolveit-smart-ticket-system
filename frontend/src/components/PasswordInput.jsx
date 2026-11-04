import { useState } from 'react';

/**
 * Reusable password input with show/hide toggle.
 * Uses type="button" to ensure the toggle never triggers form submission.
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  autoComplete = 'current-password',
  className = 'form-input',
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={className}
      />
      <button
        type="button"
        className="password-toggle-btn"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow(!show)}
      >
        {show ? (
          /* Eye-off SVG */
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          /* Eye SVG */
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
