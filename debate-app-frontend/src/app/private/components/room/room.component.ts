import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import { Socket } from "ngx-socket-io";
import { v4 as uuidv4 }  from 'uuid';
import Peer from 'peerjs';
import { StreamVideo } from '../../models/stream-video';


@Component({
  selector: 'room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.css']
})
export class RoomComponent implements OnInit {

  constructor(private route: ActivatedRoute,private socket: Socket) { }

  currentUserId:string = uuidv4();
  streamVideos: StreamVideo[] = [];
  roomId:String=this.route.snapshot.paramMap.get('roomId') as String;
  peer:Peer=new Peer(this.currentUserId,{ host: '/',port: 3000,});
  openCamera:boolean=true;
  shareScreen:boolean=false;
  hideCameraButton:boolean=false;


  ngOnInit()
  {

    this.peer.on('open', userId =>
    {
      this.socket.emit('join-room',this.roomId, userId);
    });

    navigator.mediaDevices.getUserMedia({audio:true,video:this.openCamera})
         .then((stream:MediaStream)=>{

              this.streamVideos.push({muted:true,srcObject:stream,userId:this.currentUserId});

              this.peer.on('call', (call) => {
                  call.answer(this.streamVideos[0].srcObject);
                  call.on('stream', (otherUserVideoStream: MediaStream) => {
                        this.addNewVideoStream(call.metadata.userId, otherUserVideoStream,true);
                       });
                  });

              this.socket.on('user-connected', (userId: string) => {
                setTimeout(() => {
                  const call = this.peer.call(userId, this.streamVideos[0].srcObject, {
                    metadata: { userId: this.currentUserId},
                  });
                  call.on('stream', (otherUserVideoStream: MediaStream) => {
                    this.addNewVideoStream(userId, otherUserVideoStream,true);
                  });
                  call.on('close', () => {
                    this.streamVideos = this.streamVideos.filter((video) => video.userId !== userId);
                  });
                }, 1000);
              });

              this.socket.on('user-change-stream',(userId:string,data:any)=>{
                const call = this.peer.call(userId, this.streamVideos[0].srcObject, {
                  metadata: { userId: this.currentUserId },
                });
                call.on('stream', (userStream: MediaStream) => {
                  for (let index in this.streamVideos) {
                    if(this.streamVideos[index].userId=== userId)
                    {
                      this.streamVideos[index].srcObject=userStream;
                      this.streamVideos[index].muted=data.mic;
                    }
                  }
                });
                call.on('close', () => {
                  this.streamVideos= this.streamVideos.filter((video) => video.userId !== userId);
                });
                })

              this.socket.on('user-disconnected', (userId: string) => {
                this.streamVideos= this.streamVideos.filter(video => video.userId !== userId);
              });

         });
     }

    addNewVideoStream(userId:string, stream: MediaStream,muted:boolean) {
    const alreadyExisting = this.streamVideos.some(video => video.userId ===userId);
    if (alreadyExisting)
      return;
    this.streamVideos.push({
      muted: muted,
      srcObject: stream,
      userId :userId,
    });
  }

  handleLoadMetaData(event: Event)
  {
    (event.target as HTMLVideoElement).play();
  }


  handleCloseMic(){
    this.streamVideos[0].muted=false;
    this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
  }

  handleOpenMic(){
    this.streamVideos[0].muted=true;
    this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
  }

  async handleCloseCamera()
  {
    if(this.openCamera)
    {
      this.openCamera=false;
      await navigator.mediaDevices.getUserMedia({audio:true,video:this.openCamera})
      .then((stream: MediaStream) => {
         this.streamVideos[0].srcObject=stream;
         this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
      })
    }
  }

  async handleOpenCamera()
  {
    if(!this.openCamera)
    {
      this.openCamera=true;
      await navigator.mediaDevices.getUserMedia({audio:true,video:this.openCamera})
      .then((stream: MediaStream) => {
         this.streamVideos[0].srcObject=stream;
         this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
      })
    }
  }

  async handleStopSharingScreen(){
    if(this.shareScreen)
    {
      await navigator.mediaDevices.getUserMedia({audio:true,video:this.openCamera})
      .then((stream: any) => {
        this.streamVideos[0].srcObject.getVideoTracks()
        .forEach(function(track) {
          track.stop();
       });
         this.streamVideos[0].srcObject=stream;
         this.hideCameraButton=false;
         this.shareScreen=false;
         this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
      })}
      }

      async handleShareScreen()
      {
      if(!this.shareScreen)
      {
        const mediaDevices = navigator.mediaDevices as any;
        await mediaDevices.getDisplayMedia()
          .then((stream: MediaStream) => {
            stream.getVideoTracks()[0].addEventListener('ended', () => {
              navigator.mediaDevices.getUserMedia({audio:true,video:this.openCamera})
              .then((stream)=>{
                this.streamVideos[0].srcObject=stream;
                this.hideCameraButton=false;
                this.shareScreen=false;
                this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
              })
            });

           this.streamVideos[0].srcObject=stream;
           this.hideCameraButton=true;
           this.shareScreen=true;
           this.socket.emit('change-stream',this.roomId, this.currentUserId,{mic:this.streamVideos[0].muted});
        })
      }
      }

}
