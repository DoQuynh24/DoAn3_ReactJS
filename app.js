var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var authRouter = require('./routes/auth.route');
var categorieRouter = require('./routes/categorie.route');
var productRouter = require('./routes/product.route');
var materialRouter = require('./routes/material.route');
var invoiceRouter = require('./routes/invoices.route')

var app = express();
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/auth', authRouter); 
app.use('/categories', categorieRouter);
app.use('/products', productRouter);
app.use('/materials',materialRouter);
app.use('/invoices',invoiceRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});


module.exports = app;