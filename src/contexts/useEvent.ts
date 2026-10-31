import { useContext } from 'react';
import { EventContext } from './eventContextDef';

export function useEvent() {
  return useContext(EventContext);
}
