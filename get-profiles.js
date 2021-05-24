const  faker = require("faker/locale/en")


class Profile {

  constructor(){
    this.FirstName = faker.name.firstName()
    this.LastName = faker.name.lastName();
    this.Gender = this.getGender();
    this.Latitude = faker.address.latitude();
    this.Longitude = faker.address.longitude();
    this.CreditCardNumber = faker.finance.creditCardNumber().split("-").join("").substr(0, 16);
    this.CreditCardType = this.getCreditCardType();
    this.Email = faker.internet.email();
    this.DomainName = faker.internet.domainName();
    this.PhoneNumber = faker.phone.phoneNumber(faker.phone.phoneNumberFormat(0));
    this.MacAddress = faker.internet.mac(":");
    this.URL = faker.internet.url();
    this.UserName = faker.internet.userName();
    this.LastLogin = faker.date.recent();
    this.PaymentMethod = faker.finance.transactionType();
  }

  getCreditCardType(){
    const cardTypes = ["MasterCard", "Visa", "Amex", "Discover"]
    const pick  = Math.floor(Math.random() * cardTypes.length)
    return cardTypes[pick]
  }

  getGender(){
    const genders = ["Male", "Female", "Prefer not to say"]
    const pick  = Math.floor(Math.random() * genders.length)
    return genders[pick]
  }
}

module.exports = function getProfiles() {
  const size = Math.floor(Math.random() * 25) + 40
  return Array.from(Array(size), (v)=> new Profile())
}