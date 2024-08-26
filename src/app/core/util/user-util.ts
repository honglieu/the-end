export const displayName = (firstName: string, lastName: string): string => {
  if (!firstName && !lastName) {
    return null;
  }
  if (!firstName) {
    return lastName.trim();
  }
  return firstName + ' ' + (lastName || '').trim();
};

export const mapUsersToName = (rawText: string, users) => {
  users?.forEach((user) => {
    const regex = new RegExp(`@<${user.id}>`, 'g');
    const fullName = displayName(user?.firstName, user?.lastName);
    rawText = rawText.replace(regex, `@${fullName}`);
  });
  return rawText;
};
