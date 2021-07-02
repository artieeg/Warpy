import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:flutter_ion/flutter_ion.dart' as ion;
import 'package:warpy/components/components.dart';
import 'package:warpy/constants.dart';
import 'package:warpy/locator.dart';
import 'package:warpy/services/services.dart';

class Stream extends StatefulWidget {
  final Function onTap;
  final String streamId;

  Stream({required this.onTap, required this.streamId});

  @override
  _StreamState createState() => _StreamState();
}

class _StreamState extends State<Stream> {
  late VideoPlayerController _controller;
  var user = locator<UserService>().user;

  late ion.Signal signal;
  late ion.Client client;
  late ion.LocalStream localStream;
  var renderer = RTCVideoRenderer();

  @override
  void initState() {
    super.initState();
    connect();
  }

  void connect() async {
    print("connecting to ion stream");
    await renderer.initialize();
    signal = ion.GRPCWebSignal(Constants.ION);
    client = await ion.Client.create(
        sid: widget.streamId, uid: user.id, signal: signal);

    client.ontrack = (track, ion.RemoteStream remoteStream) async {
      if (track.kind == 'video') {
        print('ontrack: remote stream => ${remoteStream.id}');
        renderer.srcObject = remoteStream.stream;
      }
    };
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return GestureDetector(
      onTap: () {
        widget.onTap();
      },
      child: Stack(
        children: [_renderRemoteVideo(size), StreamViewerControl()],
      ),
    );
  }

  FittedBox _renderRemoteVideo(Size size) {
    return FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
            width: size.width,
            height: size.height,
            child: Container(color: Colors.teal)

            /*
            RTCVideoView(renderer,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover)
                */
            ));
  }

  @override
  void dispose() {
    super.dispose();
    _controller.dispose();
  }
}