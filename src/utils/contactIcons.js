// Shared behavior only: themes own the markup and appearance of their buttons.
export const CONTACT_NUMBERS = [
  { field: "mobileNo", flag: "showMobileIcon", aliases: ["mobileNo", "mobile_no"], label: "Mobile", actionLabel: "Call tutor", type: "phone" },
  { field: "whatsappNo", flag: "showWhatsappIcon", aliases: ["whatsappNo", "whatsapp_no"], label: "WhatsApp", actionLabel: "Contact tutor on WhatsApp", type: "whatsapp" },
];

export function contactNumber(value) {
  const number = String(value ?? "").trim();
  return /^\+?[1-9]\d{9,14}$/.test(number) ? number : "";
}

export function contactIconSettings(profile = {}) {
  return Object.fromEntries(CONTACT_NUMBERS.map(({ aliases, flag }) => {
    const value = aliases.map((key) => profile[key]).find((number) => number != null && number !== "");
    return [flag, profile[flag] === true && Boolean(contactNumber(value))];
  }));
}

export function getContactActions(profile = {}) {
  const settings = contactIconSettings(profile);
  return CONTACT_NUMBERS.filter(({ flag }) => settings[flag]).map((config) => {
    const number = contactNumber(config.aliases.map((key) => profile[key]).find((value) => value != null && value !== ""));
    return {
      ...config,
      number,
      href: config.type === "whatsapp" ? `https://wa.me/${number.replace(/\D/g, "")}` : `tel:${number}`,
    };
  });
}
