process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

// global isbn variable for test cases
let test_isbn;
// seed database before each test with sample book
beforeEach(async () => {
	let book = await db.query(`
        INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES (
            '1234567890',
            'https://amazon.com/testing',
            'Paige Turner',
            'Elvish',
            100,
            'Richman Publishing',
            'Testbook',
            2020
        )
        RETURNING isbn`);
	test_isbn = book.rows[0].isbn;
});

afterEach(async () => {
	await db.query(`DELETE FROM books`);
});
afterAll(async () => {
	await db.end();
});

describe('GET /books', () => {
	test('gets list of all books in database', async () => {
		const resp = await request(app).get('/books');

		const { books } = resp.body;
		expect(books).toHaveLength(1);
		expect(books[0]).toHaveProperty('isbn');
		expect(books[0]).toHaveProperty('amazon_url');
	});
});

describe('GET /books/:isbn', () => {
	test('gets single book from database', async () => {
		const resp = await request(app).get(`/books/${test_isbn}`);
		expect(resp.body.book).toHaveProperty('isbn');
		expect(resp.body.book.isbn).toBe(test_isbn);
	});
	test('returns 404 with invalid isbn', async () => {
		const resp = await request(app).get(`/books/12345`);
		expect(resp.statusCode).toBe(404);
	});
});

describe('POST /books', () => {
	test('successfully creates book with all valid information supplied', async () => {
		const resp = await request(app).post('/books').send({
			isbn       : '2345678901',
			amazon_url : 'https://testbook.com',
			author     : 'Book Riederman',
			language   : 'wookie',
			pages      : 150,
			publisher  : 'wei suk publishing',
			title      : 'Book wars',
			year       : 1989
		});

		expect(resp.statusCode).toBe(201);
		expect(resp.body.book).toHaveProperty('isbn');
	});
	test('prevent creation with invalid or incomplete data', async () => {
		const resp = await request(app).post('/books').send({ title: 'this is all we have' });
		expect(resp.statusCode).toBe(400);
	});
});

describe('PUT /books/:isbn', () => {
	test('successfully updates book', async () => {
		const resp = await request(app).put(`/books/${test_isbn}`).send({
			amazon_url : 'https://testbook.com',
			author     : 'Book Riederman',
			language   : 'wookie',
			pages      : 150,
			publisher  : 'wei suk publishing',
			title      : 'Book wars',
			year       : 1989
		});
		expect(resp.statusCode).toBe(200);
		expect(resp.body.book).toHaveProperty('isbn');
		expect(resp.body.book.title).toBe('Book wars');
	});
	test('return 404 if bad isbn', async () => {
		const resp = await request(app).put(`/books/12345`).send({
			amazon_url : 'https://testbook.com',
			author     : 'Book Riederman',
			language   : 'wookie',
			pages      : 150,
			publisher  : 'wei suk publishing',
			title      : 'Book wars',
			year       : 1989
		});
		expect(resp.statusCode).toBe(404);
	});
	test('prevent creation if isbn is in the body', async () => {
		const resp = await request(app).put(`/books/${test_isbn}`).send({
			isbn       : test_isbn,
			amazon_url : 'https://testbook.com',
			author     : 'Book Riederman',
			language   : 'wookie',
			pages      : 150,
			publisher  : 'wei suk publishing',
			title      : 'Book wars',
			year       : 1989
		});

		expect(resp.statusCode).toBe(400);
	});
	test('prevent creation with missing data in the body', async () => {
		const resp = await request(app).put(`/books/${test_isbn}`).send({
			title : 'Missing everything'
		});
		expect(resp.statusCode).toBe(400);
	});
});

describe('DELETE /books/:isbn', () => {
	test('successfully delete book', async () => {
		const resp = await request(app).delete(`/books/${test_isbn}`);
		expect(resp.body).toHaveProperty('message');
		expect(resp.body.message).toBe('Book deleted');
	});
	test('return 404 if bad isbn', async () => {
		const resp = await request(app).delete(`/books/12345`);
		expect(resp.statusCode).toBe(404);
	});
});
