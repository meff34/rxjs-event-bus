import { Subject, Observable } from 'rxjs';
import { mergeAll } from 'rxjs/operators';

export class Bus {

  constructor() {
    this.streams = new Map();

    this.subjectsEmitter = new Subject().pipe(mergeAll());
  }

  select(type) {
    this.createStreamIfNotExists(type);
    return this.streams.get(type).asObservable();
  }

  read() {
    return this.subjectsEmitter.asObservable();
  }

  emit(event) {
    this.createStreamIfNotExists(event.type);

    this.streams.get(event.type).next(event);
  }

  createStreamIfNotExists(type) {
    if (!this.streams.has(type)) {
      this.streams.set(type, new Subject());
      this.updateMainStream(type);
    }
  }

  updateMainStream(type) {
    this.subjectsEmitter.next(this.streams.get(type));
  }
}

const bus = new Bus();

bus.select('trading_signals:add').subscribe(e => console.log('add', e, '\n'));
bus.select('trading_signals:remove').subscribe(e => console.log('rm', e, '\n'));

bus.read().subscribe(e => console.log('merged before event', e, '\n'));

bus.select('event').subscribe(e => console.log('event', e, '\n'));

bus.read().subscribe(e => console.log('merged, after all', e, '\n'));

bus.select('trading_signals:remove').subscribe(e => console.log('rm', e, '\n'));

bus.emit({ type: 'trading_signals:add', payload: 1 });
bus.emit({ type: 'trading_signals:remove', payload: 1 });
bus.emit({ type: 'event', payload: 1 });
//# sourceMappingURL=index.js.map