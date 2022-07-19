const Build = require('../models/build');
const Artifact = require('../models/artifact');
const User = require('../models/user');
const Handlebars = require('handlebars');

module.exports = (app) => {
	app.get('/', (req, res) => {
		const currentUser = req.user;
		Build.find({})
			.lean()
			.populate('owner')
			.then((builds) => res.render('builds-index', { builds, currentUser }))
			.catch((err) => {
				console.log(err.message);
			});
	});
	app.get('/builds/new', (req, res) => {
		var currentUser = req.user;
		Artifact.find({})
			.lean()
			.populate('owner')
			.populate('build')
			.then((artifacts) => res.render('builds-new', { currentUser, artifacts }))
			.catch((err) => {
				console.log(err.message);
			});
	});

	app.post('/builds/new', (req, res) => {
		if (req.user) {
			const newBuild = new Build(req.body);
			const userId = req.user._id;
			newBuild.owner = userId;
			Handlebars.registerHelper('select', function (value, options) {
				var $el = $('<select />').html(options.fn(this));
				$el.find('[value="' + value + '"]').attr({ selected: 'selected' });
				return $el.html();
			});
			newBuild
				.save()
				.then(() => User.findById(userId))
				.then((user) => {
					user.builds.unshift(newBuild);
					user.save();
					return res.redirect(`/builds/${newBuild._id}`);
				})
				.catch((err) => {
					console.log(err.message);
				});
		} else {
			return res.status(401);
		}
	});

	app.get('/builds/:id', (req, res) => {
		const currentUser = req.user;
		Build.findById(req.params.id)
			.populate('artifacts')
			.lean()
			.then((builds) => res.render('builds-show', { builds, currentUser }))
			.catch((err) => {
				console.log(err);
			});
	});

	// Outside layer here
};
