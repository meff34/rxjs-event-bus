# rxjs-event-bus

## Usage

### simple subscriber (will be **subscriber** function in all examples)
```javascript
const log = (() => {
  let counter = 0;
  return event =>
    console.log(`${++counter}: type: ${event.type}, value: ${event.payload}`)
})()
```

### pub/sub
```javascript
const bus = new Bus()

// is not subscribed
bus.emit({ type: 'first_event_name', payload: 1 })

bus
  .select('first_event_name')
  .subscribe(log)

bus
  .select('second_event_name')
  .subscribe(log)

// now subscribed
bus.emit({ type: 'first_event_name', payload: 2 })
bus.emit({ type: 'second_event_name', payload: 1 })
bus.emit({ type: 'second_event_name', payload: 2 })

/*
console output:

1. type: first_event_name, value: 2
2. type: second_event_name, value: 1
3. type: second_event_name, value: 2
*/
```

### main stream emits all events
```javascript
const bus = new Bus()

// is not subscribed
bus.emit({ type: 'first_event_name', payload: 1 })

bus
  .getMainStream()
  .subscribe(log)

// now subscribed
bus.emit({ type: 'first_event_name', payload: 2 })
bus.emit({ type: 'second_event_name', payload: 1 })
bus.emit({ type: 'third_event_name', payload: 1 })

/*
console output:

1. type: first_event_name, value: 2
2. type: second_event_name, value: 1
3. type: third_event_name, value: 1
*/
```

### pub/sub with history
will keep in memory last two events for `first_event_name` and one for `second_event_name`

```javascript
const historySettings = new Map([
  ['first_event_name', 2],
  ['second_event_name', 1]
])

const bus = new Bus(historySettings)

bus.emit({ type: 'first_event_name', payload: 1 })
bus.emit({ type: 'first_event_name', payload: 2 })
bus.emit({ type: 'first_event_name', payload: 3 })

bus.emit({ type: 'second_event_name', payload: 1 })
bus.emit({ type: 'second_event_name', payload: 2 })
bus.emit({ type: 'second_event_name', payload: 3 })


bus
  .select('first_event_name')
  .subscribe(log)

bus
  .select('second_event_name')
  .subscribe(log)

bus.emit({ type: 'first_event_name', payload: 4 })
bus.emit({ type: 'second_event_name', payload: 4 })

/*
console output:

1. type: first_event_name, value: 2
2. type: first_event_name, value: 3
3. type: second_event_name, value: 3
4. type: first_event_name, value: 4
5. type: second_event_name, value: 4
*/

```

### main stream with history
```
not ready yet 😟
```



## Development

```sh
$ git clone git@github.com:meff34/rxjs-event-bus.git
$ cd rxjs-event-bus
$ npm i
$ npm t
```


