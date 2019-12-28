export const getCurrentTime = () => {
  return parseInt(new Date().getTime().toString().slice(0, -3));
}

export const MINUTE = 60 * 1000;