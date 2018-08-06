// @flow

import { Subject, Observable, ReplaySubject } from 'rxjs'
import { mergeAll, skip } from 'rxjs/operators';

type EventType = 'event:type_1' | 'event:type_2'

type Event = {
  type: EventType,
  payload: *,
}

type BusHistorySettings = Map<EventType, number>

export class Bus {
  _subjectsEmitter: Subject
  _streams: Map<EventType, Subject> = new Map()
  _historySettings: BusHistorySettings

  constructor(historySettings?: BusHistorySettings) {
    this._subjectsEmitter = (new ReplaySubject()).pipe(mergeAll())
    this._historySettings = historySettings

    if (historySettings) {
      this._initReplaySubjects(historySettings)
    }
  }

  select(type: EventType, settings?: {historyLength: number}): Observable {
    this._createStreamIfNotExists(type)
    let observable = this._streams.get(type).asObservable()

    if (settings && settings.historyLength) {
      observable = observable.pipe(skip(this._historySettings.get(type) - settings.historyLength))
    }

    return observable
  }

  getMainStream() {
    return this._subjectsEmitter.asObservable();
  }

  emit(event: Event): void {
    this._createStreamIfNotExists(event.type)

    this._streams.get(event.type).next(event)
  }

  _createStreamIfNotExists(type: EventType) {
    if (!this._streams.has(type)) {
      this._addNewStream(type, new Subject())
    }
  }

  _updateMainStream(type: EventType) {
    this._subjectsEmitter.next(this._streams.get(type));
  }

  _initReplaySubjects(historySettings: BusHistorySettings) {
    for (var [type, value] of historySettings.entries()) {
      this._addNewStream(type, new ReplaySubject(value))
    }
  }

  _addNewStream(type: EventType, stream: Subject | ReplaySubject) {
    this._streams.set(type, stream)
    this._updateMainStream(type)
  }
}
