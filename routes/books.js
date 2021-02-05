const express = require('express');
const Book = require('../models/book');
const { validate } = require('jsonschema');
const router = new express.Router();
const ExpressError = require('../expressError');
const bookAdd = require('../schemas/bookAdd.json');
const bookUpdate = require('../schemas/bookUpdate.json');
/** GET / => {books: [book, ...]}  */

router.get('/', async function(req, res, next) {
	try {
		const books = await Book.findAll(req.query);
		return res.json({ books });
	} catch (err) {
		return next(err);
	}
});

/** GET /[id]  => {book: book} */

router.get('/:isbn', async function(req, res, next) {
	try {
		const book = await Book.findOne(req.params.isbn);
		return res.json({ book });
	} catch (err) {
		return next(err);
	}
});

/** POST /   bookData => {book: newBook}  */

router.post('/', async function(req, res, next) {
	try {
		const result = validate(req.body, bookAdd);
		if (!result.valid) {
			const listOfErrors = result.errors.map((e) => e.stack);
			const err = new ExpressError(listOfErrors, 400);
			return next(err);
		}
		const book = await Book.create(req.body);
		return res.status(201).json({ book });
	} catch (err) {
		return next(err);
	}
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put('/:isbn', async function(req, res, next) {
	try {
		// don't look for isbn in body because we aren't creating a book
		if ('isbn' in req.body) {
			const err = new ExpressError('Operation not allowed!', 400);
			return next(err);
		}
		const result = validate(req.body, bookUpdate);
		if (!result.valid) {
			const listOfErrors = result.errors.map((e) => e.stack);
			const err = new ExpressError(listOfErrors, 400);
			return next(err);
		}
		const book = await Book.update(req.params.isbn, req.body);
		return res.json({ book });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete('/:isbn', async function(req, res, next) {
	try {
		await Book.remove(req.params.isbn);
		return res.json({ message: 'Book deleted' });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
