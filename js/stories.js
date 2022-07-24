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
  return $(`
      <li id="${story.storyId}">
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
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
 async function storySubmit(e){
  e.preventDefault();
  //grab the submitted author, title and url
  const author = $('#story-author').val();
  const title = $('#story-title').val();
  const url = $('#story-url').val();

  /**
   * Sends the info to addStory; side-note, should probably hide the submit nav button
   * if there is no user logged in, as this will fail without a login token.
   */
  const story = await storyList.addStory(currentUser, {author, title, url});
  //if the story was successfully created:
  if(story instanceof Story){
    // hides the submit form and updates the story list displayed.
    hidePageComponents();
    putStoriesOnPage();
  } else{
    //otherwise, should log the error
    console.log(story);
  }
}
//adds the listener for the submit
$storyForm.on("submit", storySubmit);