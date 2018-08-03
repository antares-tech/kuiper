# Contributing

Hi, friend. Getting ready to hack on Gitty? Read this first.

## Conventions

* 2 spaces for indentation
* Lines stay under 80 cols
* Use JSDoc annotations
* Line breaks in between blocks (conditionals, functions, and var lists)

## Credits

Before sending your PR, go ahead and add yourself to the `contributors` array
in the `package.json` file. You earned it big guy. :thumbsup:

## Testing

Pretty simple: if you write some code, you write a test. If the tests fail, you
fix the code.

Tests are named according to their corresponding file and the type of test. For
instance the `repository.js` file is tested by `repository.unit.js` and
`repository.integration.js`. If the result of the test makes changes to disk,
uses the network, or has any other side effects, it's an integration test. If
not, it's a unit test.

If you need to write some files to disk for testing, do so under `$HOME/.gitty`
like the other tests, and be sure to clean up after yourself when you're tests
complete.

## Diving In

Almost all of the `Repository` methods are simply convenience wrappers around
instances of `Command`. This makes extending the `Repository` constructor with
custom methods easy as pie! Let's run through a quick example. Let's say we
want to add a method for creating a new branch and automatically switching to
it. What do we need to do?

1. Extend the `Repository` prototype
2. Create a new instance of `Command`
3. Parse the output and pass to a callback

Three steps is all it should take to add a new method to the `Repository`
constructor, and below is how you might do it. In `lib/repository.js`:

```js
// we want to pass a branch name and callback into this method
Repository.prototype.createBranchAndCheckout = function(name, callback) {
  var self = this;
  var cmd  = new Command(self, 'checkout', ['-b'], name);

  cmd.exec(function(error, stdout, stderr) {
    callback(error || stderr || null);
  });
};
```

It's a simple as that. Now you would be able to use this custom method in your
application, like so:

```js
myRepo.branchAndCheckout('myBranch', function(err) {
  if (err) {
    return console.log(err);
  }
  // ...
});
```

If the method you are adding doesn't utilize the network, please always include
a synchronous version alongside (build scripts and dev tooling is a use case
for Gitty).

```js
// we want to pass a branch name and callback into this method
Repository.prototype.createBranchAndCheckoutSync = function(name, callback) {
  var self = this
  var cmd  = new Command(self, 'checkout', ['-b'], name);

  return cmd.execSync();
};
```
