// InFormha 0.3.8 - serve le guide come JPEG standard
const GUIDE_IMAGES_038={
  chest:'guide-image/chest.jpg',
  lat:'guide-image/lat.jpg',
  pushdown:'guide-image/pushdown.jpg',
  curl:'guide-image/curl.jpg'
};
function visualBlock(id){
  const src=GUIDE_IMAGES_038[id];
  if(!src)return'';
  return `<div class="guide-photo-wrap"><img class="guide-photo" src="${src}" alt="Guida visuale ${GUIDES[id]?.title||id}" loading="eager"><div class="guide-photo-note">Tocca l'immagine per ingrandire</div></div>`;
}
