function changeIcontext(msg){
  document.getElementById("icontext").innerHTML = msg;
  if(msg == '') {
    document.getElementById("icontext").className = "icontextnobg";
  } else {
    document.getElementById("icontext").className = "icontextbg";
  }
}
