var Zone = function(zone_info){
  this.cards_dom = null;
  this.gallery = GLightbox({selector: '', elements: []});
  this.cards = [];
  this.id = zone_info.id;
  this.name = zone_info.name;
  this.masked = zone_info.masked;
  var zone_area = document.createElement('div');
  zone_area.setAttribute('class', 'zone');
  zone_area.id = zone_info.id;
  var zone_title = document.createElement('h3');
  zone_title.textContent = zone_info.name;
  this.cards_dom = document.createElement('div');
  this.cards_dom.setAttribute('class', 'flex_cards');
  this.gallery.setElements(this.cards_dom.children);
  zone_area.appendChild(zone_title);
  zone_area.appendChild(this.cards_dom);
  this.dom = zone_area;
}
Zone.prototype.add = function(card){
    var div = document.createElement('div');
    card.type = 'inline';
    div.textContent = card.text;
    card.content = card.text;
    if(card.src!==undefined){
      console.warn("Unimplemented picture card");
      var img = document.createElement('img');
      card.href = setup.img_lib + card.src;
      img.src = card.href;
      div.appendChild(img);
      card.type = 'image';
    }
    if(this.masked){
      div.textContent = this.masked + ', ID:' + card.id;
    }
    div.setAttribute('class', 'card');
    this.cards_dom.appendChild(div);
    card.dom = div;
    this.cards.push(card);
    this.gallery.setElements(this.cards);
    this.cards.forEach((card, idx)=>{
      card.dom.addEventListener('click', (e)=>{
        this.gallery.open(null, idx);
      });
    })
  }
Zone.prototype.remove = function(card){
    var removee_idx = this.cards.map((item)=>item.id).indexOf(card.id);
    if(removee_idx<0){
      return false;
    }
    const removee = (this.cards.splice(removee_idx, 1))[0];
    this.cards_dom.removeChild(removee.dom);
    if(this.remove(card)===false){
      this.gallery.setElements(this.cards);
    }
  }
