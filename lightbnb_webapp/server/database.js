const properties = require('./json/properties.json');
const users = require('./json/users.json');
const db = require('../db')

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return db.query(`
    SELECT * 
    FROM users
    WHERE email = $1`, [email])
    .then(res => res.rows && res.rows.length > 0 ? res.rows[0] : null)
    .catch(err => console.log(err));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return db.query(`
  SELECT * 
  FROM users
  WHERE id = $1`, [id])
  .then(res => res.rows && res.rows.length > 0 ? res.rows[0] : null)
  .catch(err => console.log(err));
}
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return db.query(`
  INSERT INTO users (name, password, email) 
  VALUES ($1, $2, $3) RETURNING *`, [user.name, user.password, user.email])
  .catch(err => console.log(err));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }

const getAllReservations = function(guest_id) {
  return db.query(`
  SELECT reservations.*, properties.*, AVG(property_reviews.rating) AS average_rating
  FROM reservations 
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON property_reviews.property_id = reservations.property_id
  WHERE reservations.guest_id = $1 AND reservations.end_date < now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT 10`, [guest_id])
  .then(res => res.rows) // if statement???
  .catch(err => console.log(err));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city ILIKE $${queryParams.length} `;
    }

  // if (options.owner_id) {
  //   queryParams.push(`%${options.owner_id}%`);
  //   if (queryParams.length > 0) {
  //     queryString += `AND owner_id LIKE $${queryParams.length}`;
  //   } else {
  //     queryString += `WHERE owner_id LIKE $${queryParams.length}`;
  //   }
  // }

  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night >= $${queryParams.length} `;
    } else {
    queryString += `WHERE cost_per_night >= $${queryParams.length} `;
    }
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    if (queryParams.length > 0) {
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    } else {
      queryString += `WHERE cost_per_night <= $${queryParams.length} `;
    }
  }
  
  // 4
  queryString += `GROUP BY properties.id `
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return db.query(queryString, queryParams)
  .then(res => res.rows)
  .catch(err => console.log(err));
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
// const addProperty = function(property) {
//   const propertyId = Object.keys(properties).length + 1;
//   property.id = propertyId;
//   properties[propertyId] = property;
//   return Promise.resolve(property);
// }

const addProperty = function(property) {
  return db.query(`INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
  .catch(err => console.log(err));
};
exports.addProperty = addProperty;
