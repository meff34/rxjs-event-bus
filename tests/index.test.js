import { Bus } from '../src/index'
import { merge } from 'rxjs'
import { skip } from 'rxjs/operators';

const getInstance = settings => new Bus(settings)

test('construct', () => {
  expect(getInstance).not.toThrow()
})

test('creates stream after select', () => {
  const bus = getInstance()

  bus.select('trading_signals:add')
    .subscribe(e => console.log('add', e, '\n'))

  expect(bus._streams.get('trading_signals:add')).not.toBeUndefined()
})

test('creates stream after emit', () => {
  const bus = getInstance()

  bus.emit({type: 'trading_signals:add', payload: 1})

  expect(bus._streams.get('trading_signals:add'))
    .not.toBeUndefined()
})

test('is not emit without subscriber throuth \'select(...)\'', () => {
  const subscriber = jest.fn()
  const bus = getInstance()

  bus.emit({type: 'trading_signals:add', payload: 1})

  bus.select('trading_signals:add').subscribe(subscriber)

  expect(subscriber).not.toBeCalled()
})

test('is not emit without subscriber throuth \'getMainStream(...)\'', () => {
  const subscriber = jest.fn()
  const bus = getInstance()

  bus.emit({type: 'trading_signals:add', payload: 1})

  bus.getMainStream().subscribe(subscriber)

  expect(subscriber).not.toBeCalled()
})

test('emit without subscriber throuth \'getMainStream(...)\' and with history', () => {
  const subscriber = jest.fn()
  const bus = getInstance(new Map([['event', 1]]))

  bus.emit({type: 'event', payload: 1})
  bus.emit({type: 'event', payload: 2})

  bus.getMainStream().subscribe(subscriber)

  expect(subscriber).toHaveBeenCalledTimes(1)
})

test('can not emit throuth \'select(...)\'', () => {
  const bus = getInstance()
  const observable = bus.select('event')

  expect(() => observable.emit({type: 'event', payload: 1})).toThrow()
})

test('can not emit throuth \'getMainStream()\'', () => {
  const bus = getInstance()
  const observable = bus.getMainStream()

  expect(() => observable.emit({type: 'event', payload: 1})).toThrow()
})

test('receive data on subscribe', done => {
  const bus = getInstance()

  const event = {type: 'trading_signals:add', payload: 1}

  bus
    .select('trading_signals:add')
    .subscribe(e => {
      expect(e).toEqual(event)
      done()
    })

  bus.emit(event)
})

test('receives data from several streams throuth \'getMainStream()\'', () => {
  const bus = getInstance()
  const subscriber = jest.fn();

  bus.getMainStream()
    .subscribe(subscriber)

  bus.emit({type: 'trading_signals:add', payload: 1})
  bus.emit({type: 'trading_signals:remove', payload: 1})

  expect(subscriber).toHaveBeenCalledTimes(2)
})

test('receives data from several streams throuth \'getMainStream()\' after creation of new stream', () => {
  const bus = getInstance()
  const firstSubscriber = jest.fn();
  const secondSubscriber = jest.fn();

  bus.getMainStream()
    .subscribe(firstSubscriber)

  bus.emit({type: 'trading_signals:add', payload: 1})

  bus.getMainStream()
    .subscribe(secondSubscriber)

  bus.emit({type: 'trading_signals:remove', payload: 1})

  expect(firstSubscriber).toHaveBeenCalledTimes(2);
  expect(secondSubscriber).toHaveBeenCalledTimes(1);
})

test('historySettings setup streams', () => {
  const bus = getInstance(new Map([
    ['trading_signals:remove', 1],
    ['trading_signals:add', 1000]
  ]))

  expect(bus._streams.size).toBe(2)
})

test('with historySettings receives data from past on subscribe to \'getMainStream()\'', () => {
  const bus = getInstance(new Map([
    ['trading_signals:remove', 2],
    ['trading_signals:add', 1]
  ]))

  const subscriber = jest.fn();

  bus.emit({type: 'trading_signals:add', payload: 1})
  bus.emit({type: 'trading_signals:add', payload: 2})

  bus.emit({type: 'trading_signals:remove', payload: 1})
  bus.emit({type: 'trading_signals:remove', payload: 2})
  bus.emit({type: 'trading_signals:remove', payload: 3})

  bus.emit({type: 'event', payload: 1})

  bus
    .getMainStream()
    .subscribe(subscriber)

  expect(subscriber).toHaveBeenCalledTimes(3)
})

test('with historySettings receives data from past on subscribe to \'select()\'', done => {
  const bus = getInstance(new Map([
    ['trading_signals:remove', 1]
  ]))

  const event = {type: 'trading_signals:remove', payload: 1}

  bus.emit({type: 'trading_signals:remove', payload: 1})

  bus
    .select('trading_signals:remove')
    .subscribe(e => {
      expect(e).toEqual(event)
      done()
    })
})

test('streams can be merged', () => {
  const subscriber = jest.fn()
  const bus = getInstance()
  const TSAddStream = bus.select('trading_signals:add')
  const TSRemoveStream = bus.select('trading_signals:remove')

  merge(
    TSAddStream,
    TSRemoveStream
  ).subscribe(subscriber)

  bus.emit({type: 'trading_signals:add', payload: 1})
  bus.emit({type: 'trading_signals:remove', payload: 1})

  expect(subscriber).toHaveBeenCalledTimes(2)
})

test('we can take from history what we want', () => {
  const subscriber = jest.fn()
  const bus = getInstance(new Map([
    ['event', 2]
  ]))

  bus.emit({type: 'event', payload: 1})
  bus.emit({type: 'event', payload: 2})

  bus
    .select('event', { historyLength: 1 })
    .subscribe(subscriber)

  expect(subscriber).toHaveBeenCalledTimes(1)
})
