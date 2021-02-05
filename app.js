/** Express app for bookstore. */

const express = require('express');
const app = express();

app.use(express.json());

const ExpressError = require('./expressError');
const bookRoutes = require('./routes/books');

app.use('/books', bookRoutes);

/** 404 handler */

app.use(function(req, res, next) {
	const err = new ExpressError('Not Found', 404);
	return next(err);
});

/** general error handler */

app.use(function(err, req, res, next) {
	const status = err.status || 500;

	return res.status(status).json({
		error : {
			message : err.message,
			status  : status
		}
	});
});

module.exports = app;
