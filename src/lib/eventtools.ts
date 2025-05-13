export class FEvent{
  actions: Function[];
  constructor(...actions: Function[]){
    this.actions = actions;
  }
  clearActions(){
    this.actions = [];
  }
  addResponse(action: Function){
    this.actions.push(action);
  }
  fire(...data: any[]){
    for(var i in this.actions){

      this.actions[i](...data);
      
    }
  }
}