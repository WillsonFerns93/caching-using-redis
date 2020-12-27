// imports express, redis

const express = require('express')
const redis = require('redis')
require('dotenv').config()
const axios = require('axios')
const responseTime = require('response-time')

const app = express()
app.use(responseTime())

const PORT = process.env.PORT || 3000
const REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379
console.log('PORT --> ', PORT)
console.log('REDIS_PORT --> ', REDIS_PORT)

const redis_client = redis.createClient(REDIS_PORT)

// format and respond
function formatResponse(username, data) {
  return data
}

// Cache data 
function cacheUserProfile(req, res, next) {
  const { username } = req.params

  redis_client.get(username, (err, data) => {
    if (err) {
      throw err
    }
    console.log('data ', data)
    if (data !== null) {
      res.send(formatResponse(username, JSON.parse(data)))
    } else {
      next()
    }
  })
}


// get wether by location
async function getGithubProfile(req, res, next) {
  try {
    const { username } = req.params
    const result = await axios.get(`https://api.github.com/users/${username}`)
    // .get(`https://www.metaweather.com/api/location/search/?query=${name}`)

    const data = result.data
    console.log(username, data)
    res.send(formatResponse(username, data))

    redis_client.setex(username, 60 * 5, JSON.stringify(data))
  } catch (error) {
    console.log(error)
  }
}

app.get('/profile/:username', cacheUserProfile, getGithubProfile)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})