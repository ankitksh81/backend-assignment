const express = require('express');
const router = express.Router();
const Pet = require('../database/models/pet.model');
const multer = require('multer');
// const fs = require('fs');


// @GET: to get all pets from database
router.get('/', async (req, res) => {
    try {
        const pets = await Pet.find();
        if (!pets)  return res.status(404).send('No pets found');
        res.status(200).json(pets);
    } catch (err) {
        res.status(502).send('Error retrieving pets, ' + err);
    }
});

// @POST: to add pets from excel file to database
// to be changed
// Multer storage configuration
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function(req, file, cb) {
        cb(null, 'pets.xlsx')
    }
});

const upload = multer({ storage: storage });
router.post('/', upload.single('pets'), async (req, res, next) => {
    const file = req.file
    if (!file) {
        const error = new Error('Error uploading file')
        error.httpStatusCode = 400
        return next(error);
    }
    
    const { parseData } = require('../middlewares/parse');
    try {
        const data = await parseData();
        Pet.insertMany(data).then(function(docs) {
        })
        .catch(function(err) {
            return res.status(502).send('Error while inserting data to database, ' + err);
        })
        res.status(200).json('Data inserted successfully');
    } catch(err) {
        res.status(500).send('Could not send data to database, ' + err);
    }
});

// @GET: to get specific pet from the database
router.get('/:id', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet)   return res.status(404).send(`No pet with id ${req.params.id} found`)
        res.status(200).json(pet);
    } catch(err) {
        res.status(500).send('Error retrieving pet, ' + err);
    }
});

// @PATCH: to update the details of a specific pet
router.patch('/:id', async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id).exec();
        if (!pet)   return res.status(400).send(`No pet with id ${req.params.id} found`);

        let query = {$set: {}};
        for (let key in req.body) {
            if (pet[key] && pet[key] != req.body[key]) {
                query.$set[key] = req.body[key];
            }
        }

        const updatedPet = await Pet.updateOne({_id: req.params.id}, query).exec();
        res.status(200).json(`Pet with id ${req.params.id} updated successfully.`)
    } catch(err) {
        res.status(500).send('Error updating pet, '+ err);
    }
});

// @DELETE: to delete a specific pet
router.delete('/:id', async (req, res) => {
    try {
        const pet = await Pet.findByIdAndDelete(req.params.id);
        if (!pet)   return res.statusCode(404).send(`No pet with id ${req.params.id} found`);
        
        res.status(200).send(`Pet with id ${req.params.id} successfully deleted`);
    } catch(err) {
        res.status(500).send('Error deleting pet, ' + err);
    }
});

module.exports = router;