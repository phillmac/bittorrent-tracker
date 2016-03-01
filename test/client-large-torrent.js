var common = require('./common')
var Client = require('../')
var fs = require('fs')
var parseTorrent = require('parse-torrent')
var path = require('path')
var test = require('tape')

var torrent = fs.readFileSync(path.join(__dirname, 'torrents/sintel-5gb.torrent'))
var parsedTorrent = parseTorrent(torrent)
var peerId = new Buffer('01234567890123456789')

function testLargeTorrent (t, serverType) {
  t.plan(4)

  common.createServer(t, serverType, function (server, announceUrl) {
    parsedTorrent.announce = [ announceUrl ]
    var client = new Client(peerId, 6881, parsedTorrent, { wrtc: {} })

    if (serverType === 'ws') common.mockWebsocketTracker(client)
    client.on('error', function (err) { t.error(err) })
    client.on('warning', function (err) { t.error(err) })

    client.once('update', function (data) {
      t.equal(data.announce, announceUrl)
      t.equal(typeof data.complete, 'number')
      t.equal(typeof data.incomplete, 'number')

      client.stop()

      client.once('update', function () {
        t.pass('got response to stop')
        server.close()
        client.destroy()
      })
    })

    client.start()
  })
}

test('http: large torrent: client.start()', function (t) {
  testLargeTorrent(t, 'http')
})

test('udp: large torrent: client.start()', function (t) {
  testLargeTorrent(t, 'udp')
})

test('ws: large torrent: client.start()', function (t) {
  testLargeTorrent(t, 'ws')
})
