import {set, type StringInputProps} from 'sanity';
import {wordmarkColor} from '../../src/lib/wordmark-color';

export function ColorInput(props: StringInputProps) {
  return (
    <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
      <input
        type="color"
        aria-label="Choose animated text color"
        value={wordmarkColor(props.value)}
        disabled={props.readOnly}
        onChange={event => props.onChange(set(event.currentTarget.value))}
        style={{width: 44, height: 38, padding: 2, flexShrink: 0, cursor: props.readOnly ? 'default' : 'pointer'}}
      />
      <div style={{flex: 1, minWidth: 0}}>{props.renderDefault(props)}</div>
    </div>
  );
}
