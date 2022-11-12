import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomComponent } from './components/room/room.component';
import { v4 as uuidv4 } from 'uuid';

const routes: Routes = [
  {path:'',redirectTo: `/${uuidv4()}`, pathMatch: 'full' },
  {path:":roomId",component:RoomComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivateRoutingModule { }
