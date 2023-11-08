export const computeUserCityAvatar = (context) => {
  const avatarGO = context.object3D.getObjectByProperty(
    'uuid',
    context.userData.avatar.uuid
  );

  const cityAvatar = avatarGO.children.filter(
    (el) => el.userData.isCityAvatar
  )[0];
  if (!cityAvatar) throw new Error('no city avatar in user avatar');
  return cityAvatar;
};
