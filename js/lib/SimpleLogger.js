function log(msg, withAlert = false) {
  console.log(msg);
  if (withAlert)
    alert(msg);
}

export default log;