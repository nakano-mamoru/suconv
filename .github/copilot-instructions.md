# suconv Copilot Instructions

## Converter Implementation Policy

- Keep converter code concise.
- Do not add validation logic in converters except parsing from text-box style option values.
- Do not normalize or clamp invalid values.
- Do not introduce temporary variables only for type casting.
- Do not catch errors in converters.
- Let ConvertEngine handle errors.
- Do not expose detailed error messages to the UI.
- Output detailed error information to the console.

## Error Handling Policy

- ConvertEngine must catch runtime errors from converters.
- ConvertEngine must return a generic error message for UI display.
- ConvertEngine must log detailed error information with console.error.
