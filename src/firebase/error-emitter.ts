// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class TypedEventEmitter extends EventEmitter {
  emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) {
    return super.emit(event, ...args);
  }

  on<T extends keyof Events>(event: T, listener: Events[T]) {
    return super.on(event, listener);
  }

  off<T extends keyof Events>(event: T, listener: Events[T]) {
    return super.off(event, listener);
  }
}

export const errorEmitter = new TypedEventEmitter();
