"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  /** if there is a user currently logged in,
   *  it now checks to see if the story is in the current user's favorites
   *  and adds an appropriate favorite mark., as well as checks to see
   *  if the user is the owner of the story, and adds a remove option
   */
  const storyLI = $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
    //if there is a user currently logged in,
  if(currentUser){
    //if it is a currentUser's story, add a remove option
    if(currentUser.ownStories.find(own => own.storyId === story.storyId)){
      storyLI.prepend(`<small><a href="#" class="story-delete">delete</a></small>`);
    }
    //check and mark if the story is a favorite
    if(currentUser.favorites.find(favorite => favorite.storyId === story.storyId)){
      storyLI.prepend(`<a href="#" class="story-favorite">&#9733;</a>`);
    } else {
      storyLI.prepend(`<a href="#" class="story-favorite">&#9734;</a>`);
    }
  }
  return storyLI;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/**
 * handler for story form submission, adds a story to the story list
 * and puts the story on the page. 
 */
async function storySubmit(e) {
  e.preventDefault();
  //grab the submitted author, title and url
  const author = $('#story-author').val();
  const title = $('#story-title').val();
  const url = $('#story-url').val();

  /**
   * Sends the info to addStory; side-note, should probably hide the submit nav button
   * if there is no user logged in, as this will fail without a login token.
   */
  const story = await storyList.addStory(currentUser, { author, title, url });
  //if the story was successfully created:
  if (story instanceof Story) {
    // hides the submit form and updates the story list displayed.
    hidePageComponents();
    putStoriesOnPage();
  }
}
/** adds the listener for the submit */
$storyForm.on("submit", storySubmit);

/** sets up a listener on the story list for clicks on the favorite star links */
$allStoriesList.on("click", ".story-favorite", async function (e) {
  e.preventDefault();
  /** we need to find the story in the story list in order to favorite it.
   * first, we find the closest LI, which will have the id of the story's storyId.
   * then, we search the storyList for the story that matches that storyId.
   * we call favoriteStory and change the innerHTML of the target
   */
  const sId = $(e.target).closest("li").attr("id");
  const foundStory = storyList.stories.find(li => li.storyId === sId);
  const message = await currentUser.favoriteStory(foundStory);
  console.log(message);
  if (message === "Favorite Added!") {
    e.target.innerHTML = "&#9733;";
  }
  else if (message === "Favorite Removed!") {
    e.target.innerHTML = "&#9734;";
  }
});

/** sets up a listener on the story list for clicks on delete links */
$allStoriesList.on("click", ".story-delete", async function(e){
  /** we need to find the storyId of the story, and delete it.
   *  first, we again find the closest LI to get the stories id.
   *  then we send the delete call, and simply remove the LI from the ol.
   */
  const parent = $(e.target).closest("li");
  const message = await currentUser.deleteStory(parent.attr("id"));
  parent.remove();
  console.log(message);
});

/** gets the favorites of the currentUser and puts them on the page*/
function putFavoritesOnPage() {
  $allStoriesList.empty();
  // loop through all of our stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}